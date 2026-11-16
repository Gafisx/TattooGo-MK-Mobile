declare namespace JSX {
  interface IntrinsicElements {
    pointsMaterial: any;
    ambientLight: any;
  }
}

declare namespace React.JSX {
  interface IntrinsicElements {
    pointsMaterial: any;
    ambientLight: any;
  }
}

declare module '@expo/vector-icons' {
  const content: any;
  export default content;
  export const Ionicons: any;
  export const FontAwesome: any;
  export const FontAwesome5: any;
  export const FontAwesome6: any;
  export const MaterialIcons: any;
  export const MaterialCommunityIcons: any;
  export const Feather: any;
  export const AntDesign: any;
  export const Entypo: any;
  export const SimpleLineIcons: any;
  export const Octicons: any;
  export const Foundation: any;
  export const EvilIcons: any;
  export const Zocial: any;
}

declare module '@expo/vector-icons/*' {
  const content: any;
  export default content;
}

declare module '@clerk/clerk-expo' {
  export interface TokenCache {
    getToken: (key: string) => Promise<string | null>;
    saveToken: (key: string, token: string) => Promise<void>;
    clearToken?: (key: string) => Promise<void>;
  }
  export const ClerkProvider: any;
  export const ClerkLoaded: any;
  export const SignedIn: any;
  export const SignedOut: any;
  export const useAuth: any;
  export const useUser: any;
  export const useSignIn: any;
  export const useSignUp: any;
  export const useClerk: any;
  export const useSession: any;
  export const getClerkInstance: any;
  export function isClerkAPIResponseError(error: unknown): error is {
    errors: { message?: string; longMessage?: string }[];
  };
}

declare module 'expo-location' {
  const content: any;
  export default content;
  export const requestForegroundPermissionsAsync: any;
  export const getCurrentPositionAsync: any;
  export const reverseGeocodeAsync: any;
  export const useForegroundPermissions: any;
  export const hasServicesEnabledAsync: any;
  export const Accuracy: any;
}

declare module '@gorhom/bottom-sheet' {
  export class BottomSheetModal extends React.Component<any> {
    present: () => void;
    dismiss: () => void;
  }
  export const BottomSheetModalProvider: any;
  export const BottomSheetView: any;
  export const BottomSheetTextInput: any;
  export const BottomSheetScrollView: any;
  export const BottomSheetFlatList: any;
  export const BottomSheetBackdrop: any;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: any;
  export const SafeAreaView: any;
  export const useSafeAreaInsets: any;
  export const initialWindowMetrics: any;
  export interface EdgeInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
}

declare module 'react-hook-form' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export function useForm<T = Record<string, unknown>>(...args: any[]): any;
  export const Controller: any;
  export const FormProvider: any;
  export const useFormContext: any;
  export const useWatch: any;
  export const useFieldArray: any;
}

declare module '@hookform/resolvers/zod' {
  export const zodResolver: any;
}

declare module '@hookform/resolvers' {
  export const zodResolver: any;
}

declare module 'three' {
  export const Vector3: any;
  export const Box3: any;
  export const Line: any;
  export const Points: any;
  export const CatmullRomCurve3: any;
  export const Mesh: any;
  export const Group: any;
  export const Object3D: any;
  export const MeshStandardMaterial: any;
  export const BufferGeometry: any;
  export const LineBasicMaterial: any;
  export const MathUtils: any;
  export const DynamicDrawUsage: any;
  export const BufferAttribute: any;
  export const PointLight: any;
  export type Vector3 = any;
  export type Box3 = any;
  export type Line = any;
  export type Points = any;
  export type CatmullRomCurve3 = any;
  export type Mesh = any;
  export type Group = any;
  export type Object3D = any;
  export type Material = any;
  export type BufferGeometry = any;
  export type MeshStandardMaterial = any;
  export type PointsMaterial = any;
  export type LineBasicMaterial = any;
  export type PointLight = any;
  export type BufferAttribute = any;
  const content: any;
  export default content;
}

declare module '@react-three/fiber/native' {
  export const Canvas: any;
  export const useFrame: any;
  export const useThree: any;
}

declare module '@react-three/drei/native' {
  export const OrbitControls: any;
  export const useGLTF: any;
}
