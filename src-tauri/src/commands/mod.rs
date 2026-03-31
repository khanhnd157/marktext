pub mod filesystem;
pub mod preferences;
pub mod window;

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to MarkText Tauri.", name)
}
