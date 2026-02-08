import React from 'react';
import clsx from 'clsx';

interface MaskableSectionProps {
    isMasked: boolean;
    isHidden: boolean;
    isLocked?: boolean;
    onToggle: () => void;
    onLongPress?: () => void;
    spacing?: 'none' | 'inset' | 'contentInset';
    className?: string;
    children: React.ReactNode;
}

interface MaskOverlayProps {
    isMasked: boolean;
    isHidden: boolean;
    isLocked: boolean;
    onToggle: () => void;
    onLongPress?: () => void;
}

export const MaskableSection: React.FC<MaskableSectionProps> = ({
    isMasked,
    isHidden,
    isLocked = false,
    onToggle,
    onLongPress,
    spacing = 'none',
    className,
    children
}) => {
    const spacingClass = spacing === 'inset'
        ? '-m-2 p-2'
        : spacing === 'contentInset'
            ? 'p-2'
            : undefined;
    return (
        <div className={clsx("relative rounded-lg overflow-hidden", spacingClass, className)}>
            <MaskOverlay
                isMasked={isMasked}
                isHidden={isHidden}
                isLocked={isLocked}
                onToggle={onToggle}
                onLongPress={onLongPress}
            />
            {children}
        </div>
    );
};

const LONG_PRESS_MS = 450;

const MaskOverlay: React.FC<MaskOverlayProps> = ({ isMasked, isHidden, isLocked, onToggle, onLongPress }) => {
    const longPressTimerRef = React.useRef<number | null>(null);
    const longPressTriggeredRef = React.useRef(false);

    const clearLongPressTimer = React.useCallback(() => {
        if (longPressTimerRef.current !== null) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const startLongPressTimer = React.useCallback(() => {
        if (isHidden || !onLongPress) return;
        longPressTriggeredRef.current = false;
        clearLongPressTimer();
        longPressTimerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            onLongPress();
        }, LONG_PRESS_MS);
    }, [clearLongPressTimer, isHidden, onLongPress]);

    if (!isMasked) return null;

    return (
        <button
            type="button"
            onPointerDown={startLongPressTimer}
            onPointerUp={(e) => {
                clearLongPressTimer();
                if (longPressTriggeredRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onPointerCancel={clearLongPressTimer}
            onPointerLeave={clearLongPressTimer}
            onClick={(e) => {
                e.stopPropagation();
                if (longPressTriggeredRef.current) {
                    longPressTriggeredRef.current = false;
                    return;
                }
                onToggle();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={clsx(
                "absolute inset-0 cursor-pointer transition-colors duration-200 z-10 rounded-lg border-0 p-0 appearance-none",
                isHidden && "bg-[#2B7FFF]",
                !isHidden && !isLocked && "bg-[#2B7FFF]/20 hover:bg-[#2B7FFF]/30",
                !isHidden && isLocked && "bg-yellow-400/20 border border-yellow-400/30 hover:bg-yellow-400/30"
            )}
            title={isHidden ? "タップで表示" : "タップで隠す"}
            aria-label={isHidden ? "タップで表示" : "タップで隠す"}
            aria-pressed={!isHidden}
        />
    );
};
