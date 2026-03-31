use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::{AppHandle, Wry};

pub fn create_app_menu(app: &AppHandle) -> Result<tauri::menu::Menu<Wry>, tauri::Error> {
    let file_menu = SubmenuBuilder::new(app, "File")
        .text("new-file", "New File")
        .text("new-window", "New Window")
        .separator()
        .text("open-file", "Open File")
        .text("open-folder", "Open Folder")
        .separator()
        .text("save", "Save")
        .text("save-as", "Save As...")
        .separator()
        .text("export-html", "Export HTML")
        .text("export-pdf", "Export PDF")
        .separator()
        .text("print", "Print")
        .separator()
        .text("close-window", "Close Window")
        .text("quit", "Quit")
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .text("find", "Find")
        .text("replace", "Find and Replace")
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .text("toggle-sidebar", "Toggle Sidebar")
        .text("toggle-toc", "Table of Contents")
        .separator()
        .text("source-code", "Source Code Mode")
        .text("typewriter", "Typewriter Mode")
        .text("focus", "Focus Mode")
        .separator()
        .text("zoom-in", "Zoom In")
        .text("zoom-out", "Zoom Out")
        .text("zoom-reset", "Reset Zoom")
        .build()?;

    let help_menu = SubmenuBuilder::new(app, "Help")
        .text("about", "About MarkText")
        .text("check-update", "Check for Updates")
        .separator()
        .text("website", "Website")
        .text("report-bug", "Report Bug")
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu, &view_menu, &help_menu])
        .build()?;

    Ok(menu)
}
