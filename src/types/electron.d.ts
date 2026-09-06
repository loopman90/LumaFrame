declare module "electron" {
  export const dialog:
    | {
        showOpenDialog(options: { properties: string[] }): Promise<{ canceled: boolean; filePaths: string[] }>;
      }
    | undefined;

  export const remote:
    | {
        dialog?: {
          showOpenDialog(options: { properties: string[] }): Promise<{ canceled: boolean; filePaths: string[] }>;
        };
      }
    | undefined;
}
