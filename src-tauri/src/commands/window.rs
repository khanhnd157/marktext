use tauri::Manager;

#[tauri::command]
pub async fn close_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| format!("Failed to close window: {}", e))
}

#[tauri::command]
pub async fn toggle_always_on_top(window: tauri::WebviewWindow) -> Result<bool, String> {
    let is_on_top = window
        .is_always_on_top()
        .map_err(|e| format!("Failed to get always on top: {}", e))?;
    window
        .set_always_on_top(!is_on_top)
        .map_err(|e| format!("Failed to set always on top: {}", e))?;
    Ok(!is_on_top)
}

#[tauri::command]
pub async fn set_title(window: tauri::WebviewWindow, title: String) -> Result<(), String> {
    window
        .set_title(&title)
        .map_err(|e| format!("Failed to set title: {}", e))
}

#[tauri::command]
pub async fn create_editor_window(app: tauri::AppHandle) -> Result<(), String> {
    let label = format!("editor-{}", uuid_simple());
    let url = tauri::WebviewUrl::App("index.html?type=editor".into());

    tauri::WebviewWindowBuilder::new(&app, &label, url)
        .title("MarkText")
        .inner_size(1200.0, 800.0)
        .min_inner_size(500.0, 400.0)
        .center()
        .build()
        .map_err(|e| format!("Failed to create editor window: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn create_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("settings") {
        win.set_focus()
            .map_err(|e| format!("Failed to focus settings: {}", e))?;
        return Ok(());
    }

    let url = tauri::WebviewUrl::App("index.html?type=settings".into());

    tauri::WebviewWindowBuilder::new(&app, "settings", url)
        .title("MarkText - Settings")
        .inner_size(950.0, 650.0)
        .min_inner_size(700.0, 500.0)
        .center()
        .build()
        .map_err(|e| format!("Failed to create settings window: {}", e))?;

    Ok(())
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let dur = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{:x}{:x}", dur.as_secs(), dur.subsec_nanos())
}
