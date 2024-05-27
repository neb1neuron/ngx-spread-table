import { EventEmitter } from "@angular/core";
import { Change } from "../services/undo-redo.service";
import { Cell, Column } from "./cell.model";
import { ContextMenuModel } from "./context-menu.model";

export class SpreadTable {
  // inputs
  minColumnWidth: number = 100;
  rowHeight: number = 24;
  indexWidth: number = 60;
  rawData: any;
  headerBgColor: string = '#634be3';
  headerColor: string = '#efefef';
  columns: Column[] = [];

  columnMenuItems: ContextMenuModel[] = [];
  contextMenuItems: ContextMenuModel[] = [];
  extraContextMenuItems: ContextMenuModel[] = [];

  //outputs
  cellValueChange: EventEmitter<Change[]> = new EventEmitter<Change[]>();
  contextMenuEvent: EventEmitter<ContextMenuModel> = new EventEmitter<ContextMenuModel>();

  public getSelectedCells(): Cell[] { return []; }
  public getData() { }
  resetColumnWidths() { }
}
