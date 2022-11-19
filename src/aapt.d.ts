declare module "node-aapt" {
  export type packageInfo = {
    packageName: string,
    versionCode: string,
    versionName: string
  }
  export default async function(filePath: string): Promise<packageInfo>;
  export default function(filePath: string, callback: (error: null|Error, data: packageInfo) => void): void;
}