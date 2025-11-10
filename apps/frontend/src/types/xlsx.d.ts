declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [name: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: CellObject | any;
  }

  export interface CellObject {
    v: any;
    t: string;
    f?: string;
    r?: string;
    h?: string;
    w?: string;
  }

  export const utils: {
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
    aoa_to_sheet(data: any[][]): WorkSheet;
    sheet_to_json(worksheet: WorkSheet, options?: any): any[];
  };

  export function writeFile(workbook: WorkBook, filename: string, options?: any): void;
  export function read(data: any, options?: any): WorkBook;
}