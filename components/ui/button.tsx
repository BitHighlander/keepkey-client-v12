import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import {
    AbsoluteCenter,
    Button as ChakraButton,
    Spinner,
} from "@chakra-ui/react";
import { forwardRef } from "react";

interface ButtonLoadingProps {
    loading?: boolean;
    loadingText?: React.ReactNode;
}

export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(props, ref) {
        const { loading, disabled, loadingText, children, ...rest } = props;

        return (
            <ChakraButton
                disabled={loading || disabled}
                ref={ref}
                bg="#b57f1e" // Apply keepKeyGold color directly
                color="white" // Ensure the text is readable
                _hover={{
                    bg: "#916419", // Darker shade on hover
                }}
                {...rest}
            >
                {loading && !loadingText ? (
                    <>
                        <AbsoluteCenter display="inline-flex">
                            <Spinner size="inherit" color="inherit" />
                        </AbsoluteCenter>
                        <span style={{ opacity: 0 }}>{children}</span>
                    </>
                ) : loading && loadingText ? (
                    <>
                        <Spinner size="inherit" color="inherit" />
                        {loadingText}
                    </>
                ) : (
                    children
                )}
            </ChakraButton>
        );
    }
);
