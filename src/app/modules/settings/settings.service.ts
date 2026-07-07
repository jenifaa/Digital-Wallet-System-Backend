
import { DEFAULT_SETTINGS, ISystemSettings } from "./settings.interface";
import { SystemSettings } from "./settings.model";

let cachedSettings: ISystemSettings | null = null;

const getSettings = async (): Promise<ISystemSettings> => {
  if (cachedSettings) {
    return cachedSettings;
  }

  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create(DEFAULT_SETTINGS);
  }

  cachedSettings = settings.toObject();
  return cachedSettings;
};

const updateSettings = async (
  payload: Partial<ISystemSettings>,
  adminId: string,
): Promise<ISystemSettings> => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({ ...DEFAULT_SETTINGS, ...payload, updatedBy: adminId });
  } else {
    Object.assign(settings, payload, { updatedBy: adminId });
    await settings.save();
  }

  cachedSettings = settings.toObject();
  return cachedSettings;
};

const invalidateCache = () => {
  cachedSettings = null;
};

export const SettingsService = {
  getSettings,
  updateSettings,
  invalidateCache,
};
