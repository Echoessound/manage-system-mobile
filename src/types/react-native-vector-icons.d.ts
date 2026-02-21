declare module 'react-native-vector-icons/MaterialIcons' {
  import { TextProps } from 'react-native';
  import { FC } from 'react';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  const Icon: FC<IconProps>;
  export default Icon;
}

declare module 'react-native-vector-icons/Ionicons' {
  import { TextProps } from 'react-native';
  import { FC } from 'react';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  const Icon: FC<IconProps>;
  export default Icon;
}
