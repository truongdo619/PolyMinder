/// <reference types="vite/client" />

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.PNG';
declare module '*.JPG';
declare module '*.JPEG';

declare module 'mui-datatables' {
  import { ComponentType } from 'react';

  interface MUIDataTableColumn {
    name: string;
    label?: string;
    options?: {
      filter?: boolean;
      sort?: boolean;
      display?: boolean | 'excluded';
      customBodyRender?: (value: string, tableMeta: MUIDataTableMeta, updateValue: (v: string) => void) => React.ReactNode;
      customBodyRenderLite?: (dataIndex: number, rowIndex: number) => React.ReactNode;
      [key: string]: unknown;
    };
  }

  interface MUIDataTableMeta {
    rowIndex: number;
    columnIndex: number;
    tableData: string[][];
    rowData: string[];
  }

  interface MUIDataTableOptions {
    filterType?: string;
    responsive?: string;
    selectableRows?: 'none' | 'single' | 'multiple';
    download?: boolean;
    print?: boolean;
    search?: boolean;
    filter?: boolean;
    viewColumns?: boolean;
    pagination?: boolean;
    rowsPerPage?: number;
    rowsPerPageOptions?: number[];
    elevation?: number;
    onRowClick?: (rowData: string[], rowMeta: { dataIndex: number; rowIndex: number }) => void;
    customToolbar?: () => React.ReactNode;
    customToolbarSelect?: (selectedRows: { data: { index: number; dataIndex: number }[] }) => React.ReactNode;
    textLabels?: Record<string, Record<string, string>>;
    [key: string]: unknown;
  }

  const MUIDataTable: ComponentType<{
    title: string | React.ReactNode;
    data: (string | number)[][] | object[];
    columns: MUIDataTableColumn[];
    options?: MUIDataTableOptions;
    className?: string;
  }>;

  export type MUIDataTableColumnDef = MUIDataTableColumn;
  export default MUIDataTable;
}

interface JQueryStatic {
  (selector: string): { on(event: string, handler: () => void): void };
}

declare const $: JQueryStatic;

interface BratDispatcher {
  post(event: string, args: unknown[]): void;
}

declare const Util: {
  embed(id: string, collData: unknown, docData: unknown, webFontURLs: string[]): BratDispatcher;
};
