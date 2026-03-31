use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub content: String,
    pub encoding: String,
    pub line_ending: String,
    pub filename: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_file: bool,
    pub is_markdown: bool,
}

#[tauri::command]
pub async fn read_markdown_file(path: String) -> Result<FileContent, String> {
    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let raw_bytes = tokio::fs::read(&file_path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let mut detector = chardetng::EncodingDetector::new();
    detector.feed(&raw_bytes, true);
    let detected = detector.guess(None, true);
    let encoding_name = detected.name().to_string();

    let (content, _, _) = detected.decode(&raw_bytes);
    let content = content.into_owned();

    let line_ending = if content.contains("\r\n") {
        "crlf".to_string()
    } else {
        "lf".to_string()
    };

    let filename = file_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(FileContent {
        content,
        encoding: encoding_name,
        line_ending,
        filename,
    })
}

#[tauri::command]
pub async fn write_markdown_file(
    path: String,
    content: String,
    encoding: Option<String>,
    line_ending: Option<String>,
) -> Result<(), String> {
    let mut write_content = content;

    if let Some(le) = line_ending {
        if le == "crlf" {
            write_content = write_content.replace('\n', "\r\n");
        }
    }

    let bytes = if let Some(enc) = encoding {
        let encoding = encoding_rs::Encoding::for_label(enc.as_bytes())
            .unwrap_or(encoding_rs::UTF_8);
        let (encoded, _, _) = encoding.encode(&write_content);
        encoded.into_owned()
    } else {
        write_content.into_bytes()
    };

    if let Some(parent) = PathBuf::from(&path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    tokio::fs::write(&path, bytes)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = PathBuf::from(&path);
    if !dir_path.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries = Vec::new();
    let mut read_dir = tokio::fs::read_dir(&dir_path)
        .await
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    while let Some(entry) = read_dir
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        let metadata = entry
            .metadata()
            .await
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        let name = entry.file_name().to_string_lossy().to_string();
        let entry_path = entry.path().to_string_lossy().to_string();
        let is_dir = metadata.is_dir();
        let is_file = metadata.is_file();
        let is_markdown = is_file
            && name
                .rsplit('.')
                .next()
                .map(|ext| {
                    matches!(
                        ext.to_lowercase().as_str(),
                        "md" | "markdown" | "mmd" | "mdown" | "mdtxt" | "mdtext" | "rmd"
                    )
                })
                .unwrap_or(false);

        entries.push(FileEntry {
            name,
            path: entry_path,
            is_directory: is_dir,
            is_file,
            is_markdown,
        });
    }

    entries.sort_by(|a, b| {
        if a.is_directory == b.is_directory {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_directory {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(entries)
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    tokio::fs::rename(&old_path, &new_path)
        .await
        .map_err(|e| format!("Failed to rename: {}", e))
}

#[tauri::command]
pub async fn trash_item(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| format!("Failed to trash: {}", e))
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    tokio::fs::create_dir_all(&path)
        .await
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn copy_file(src: String, dest: String) -> Result<(), String> {
    if let Some(parent) = PathBuf::from(&dest).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create parent dir: {}", e))?;
    }
    tokio::fs::copy(&src, &dest)
        .await
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(PathBuf::from(&path).exists())
}

#[tauri::command]
pub async fn detect_encoding(path: String) -> Result<String, String> {
    let raw_bytes = tokio::fs::read(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let mut detector = chardetng::EncodingDetector::new();
    detector.feed(&raw_bytes, true);
    let detected = detector.guess(None, true);
    Ok(detected.name().to_string())
}

pub struct WatcherState {
    pub watchers: std::sync::Mutex<std::collections::HashMap<String, notify::RecommendedWatcher>>,
}

#[tauri::command]
pub async fn watch_path(
    path: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    use notify::{Watcher, RecursiveMode};
    use tauri::Emitter;

    let watch_path = path.clone();
    let mut watcher = notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
        match res {
            Ok(event) => {
                let _ = app.emit("fs-change", serde_json::json!({
                    "path": watch_path.clone(),
                    "kind": format!("{:?}", event.kind),
                    "paths": event.paths.iter().map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>(),
                }));
            }
            Err(e) => {
                log::error!("Watch error: {:?}", e);
            }
        }
    }).map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch: {}", e))?;

    std::mem::forget(watcher);

    Ok(())
}

#[tauri::command]
pub async fn unwatch_path(path: String) -> Result<(), String> {
    log::info!("Unwatching path: {}", path);
    Ok(())
}
