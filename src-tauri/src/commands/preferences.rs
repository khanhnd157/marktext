use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Preferences {
    pub auto_save: bool,
    pub auto_pair_bracket: bool,
    pub auto_pair_markdown_syntax: bool,
    pub auto_pair_quote: bool,
    pub bullet_list_marker: String,
    pub code_font_family: String,
    pub code_font_size: f64,
    pub code_block_line_numbers: bool,
    pub editor_font_family: String,
    pub editor_font_size: f64,
    pub editor_line_width: String,
    pub end_of_line: String,
    pub file_encoding: String,
    pub hide_scrollbar: bool,
    pub list_indentation: String,
    pub markdown_extensions: Vec<String>,
    pub ordered_list_delimiter: String,
    pub prefer_heading_style: String,
    pub prefer_loose_list_item: bool,
    pub sidebar: bool,
    pub tab_size: u32,
    pub text_direction: String,
    pub theme: String,
    pub title_bar_style: String,
    pub zoom: f64,
}

impl Default for Preferences {
    fn default() -> Self {
        Self {
            auto_save: false,
            auto_pair_bracket: true,
            auto_pair_markdown_syntax: true,
            auto_pair_quote: true,
            bullet_list_marker: "-".to_string(),
            code_font_family: "".to_string(),
            code_font_size: 14.0,
            code_block_line_numbers: false,
            editor_font_family: "Open Sans".to_string(),
            editor_font_size: 16.0,
            editor_line_width: "".to_string(),
            end_of_line: "default".to_string(),
            file_encoding: "utf-8".to_string(),
            hide_scrollbar: false,
            list_indentation: "1".to_string(),
            markdown_extensions: vec![
                "md".to_string(),
                "markdown".to_string(),
                "mmd".to_string(),
                "mdown".to_string(),
                "mdtxt".to_string(),
                "mdtext".to_string(),
            ],
            ordered_list_delimiter: ".".to_string(),
            prefer_heading_style: "atx".to_string(),
            prefer_loose_list_item: true,
            sidebar: false,
            tab_size: 4,
            text_direction: "ltr".to_string(),
            theme: "light".to_string(),
            title_bar_style: "custom".to_string(),
            zoom: 1.0,
        }
    }
}

#[tauri::command]
pub async fn get_preferences(app: tauri::AppHandle) -> Result<Value, String> {
    let store = app
        .store("preferences.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let prefs: Option<Value> = store.get("preferences");
    match prefs {
        Some(val) => Ok(val),
        None => {
            let defaults = Preferences::default();
            let value = serde_json::to_value(&defaults)
                .map_err(|e| format!("Serialize error: {}", e))?;
            store.set("preferences", value.clone());
            Ok(value)
        }
    }
}

#[tauri::command]
pub async fn set_preference(
    app: tauri::AppHandle,
    key: String,
    value: Value,
) -> Result<(), String> {
    let store = app
        .store("preferences.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let current: Option<Value> = store.get("preferences");
    let mut prefs: HashMap<String, Value> = match current {
        Some(val) => serde_json::from_value::<HashMap<String, Value>>(val).unwrap_or_default(),
        None => {
            let defaults = Preferences::default();
            serde_json::from_value::<HashMap<String, Value>>(
                serde_json::to_value(&defaults).unwrap_or_default(),
            )
            .unwrap_or_default()
        }
    };

    prefs.insert(key, value);
    let new_val = serde_json::to_value(&prefs)
        .map_err(|e| format!("Serialize error: {}", e))?;
    store.set("preferences", new_val);

    Ok(())
}

#[tauri::command]
pub async fn get_preference(
    app: tauri::AppHandle,
    key: String,
) -> Result<Value, String> {
    let store = app
        .store("preferences.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let current: Option<Value> = store.get("preferences");
    let prefs: HashMap<String, Value> = match current {
        Some(val) => serde_json::from_value::<HashMap<String, Value>>(val).unwrap_or_default(),
        None => HashMap::new(),
    };

    Ok(prefs.get(&key).cloned().unwrap_or(Value::Null))
}
