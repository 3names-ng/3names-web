import { useAlertBannerStore } from "@/store/alertBannerStore";

/**
 * Show a success alert banner.
 */
export const showSuccess = (
  message: string,
  _title: string = "Success"
) => {
  useAlertBannerStore.getState().show(message, "success");
};

/**
 * Show an error alert banner.
 */
export const showError = (
  message: string,
  _title: string = "Error"
) => {
  useAlertBannerStore.getState().show(message, "error");
};

/**
 * Show an info alert banner.
 */
export const showInfo = (
  message: string,
  _title: string = "Info"
) => {
  useAlertBannerStore.getState().show(message, "info");
};