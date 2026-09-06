import { App, FuzzySuggestModal, TAbstractFile, TFolder } from "obsidian";

export class VaultFolderSuggestModal extends FuzzySuggestModal<TFolder> {
  constructor(
    app: App,
    private readonly onChooseFolder: (folder: TFolder) => void
  ) {
    super(app);
    this.setPlaceholder("Choose a vault folder");
  }

  getItems(): TFolder[] {
    const folders: TFolder[] = [];
    collectFolders(this.app.vault.getRoot(), folders);
    return folders;
  }

  getItemText(folder: TFolder): string {
    return folder.path || "Vault root";
  }

  onChooseItem(folder: TFolder): void {
    this.onChooseFolder(folder);
  }
}

function collectFolders(file: TAbstractFile, folders: TFolder[]): void {
  if (!(file instanceof TFolder)) return;
  folders.push(file);
  for (const child of file.children) collectFolders(child, folders);
}
