import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { LicenseManager, TreeDataModule } from 'ag-grid-enterprise';

const key = import.meta.env.VITE_AG_GRID_LICENSE_KEY;
if (typeof key === 'string' && key.length > 0) {
  LicenseManager.setLicenseKey(key);
}

let registered = false;

export function registerAgGridModules(): void {
  if (registered) {
    return;
  }
  registered = true;
  ModuleRegistry.registerModules([AllCommunityModule, TreeDataModule]);
}

registerAgGridModules();
