import { useAuthStore } from "@/store/authStore";
import { showError } from "@/components/ui/toast";

const DEFAULT_MESSAGE =
  "This is disabled while your account is restricted. Contact support if you think this is a mistake.";

/**
 * Shared gate for the handful of actions the backend blocks for a
 * `restricted` account (new posts/stories, marketplace/hostel listings,
 * sending gifts — see BlockRestricted on the API). Lets screens disable the
 * relevant button up front instead of only finding out after a 403.
 */
export function useCreateRestriction() {
  const isRestricted = useAuthStore((state) => state.user?.status === "restricted");

  const guardCreate = (message?: string) => {
    if (isRestricted) {
      showError(message || DEFAULT_MESSAGE);
      return false;
    }
    return true;
  };

  return { isRestricted, guardCreate };
}
