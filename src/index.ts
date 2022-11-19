import * as apkMirror from "./apkmirror";
import * as Evox from "./Evox";
import * as PixelExperience from "./pixelExperience";
(async function main(){
  const evoxData = await Evox.listPackages("13").then(res => res.get_gapps_dict());
  const pixelExperienceData = await PixelExperience.listPackages("13").then(res => res.get_gapps_dict());
  const apkMirrrorData = await apkMirror.listPackages().then(res => res.get_apk_download("com.android.chrome"));
  return {apkMirrrorData, evoxData, pixelExperienceData};
})().then(console.log);