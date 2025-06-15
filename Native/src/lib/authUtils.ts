import { Alert } from 'react-native';

export function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('401') || 
         error?.status === 401 || 
         error?.message?.includes('Unauthorized');
}

export function handleAuthError(error: any, onUnauthorized?: () => void) {
  if (isUnauthorizedError(error)) {
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please log in again.",
      [
        {
          text: "OK",
          onPress: onUnauthorized || (() => {
            // TODO: Navigate to login screen
            console.log("Need to implement navigation to login");
          })
        }
      ]
    );
    return true;
  }
  return false;
}
