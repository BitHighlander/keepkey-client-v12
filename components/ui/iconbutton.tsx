import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import {
    IconButton as ChakraIconButton,
    Spinner,
} from "@chakra-ui/react";
import { forwardRef, ReactNode } from "react";

interface ButtonLoadingProps {
    loading?: boolean;
    loadingText?: React.ReactNode;
    icon?: ReactNode;
}

export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {}

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
    function IconButton(props, ref) {
        const { loading, disabled, loadingText, icon, ...rest } = props;

        return (
            <ChakraIconButton
                disabled={loading || disabled}
                ref={ref}
                bg="#b57f1e" // KeepKey Gold background color
                color="white" // White icon color
                _hover={{ bg: "#916419" }} // Darker gold on hover
                aria-label={loadingText ? String(loadingText) : "Icon Button"}
                {...rest}
            >
                {loading ? <Spinner size="sm" color="white" /> : icon} {/* Display the icon inside */}
            </ChakraIconButton>
        );
    }
);
