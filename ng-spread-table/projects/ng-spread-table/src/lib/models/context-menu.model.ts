import { Column } from "./cell.model";

export class ContextMenuModel {
  iconHtml?: string = '';
  menuText?: string = '';
  menuEvent?: string = '';
  shortcut?: string = '';
  disabled?: boolean = false;
  column?: Column | null | undefined;
}
