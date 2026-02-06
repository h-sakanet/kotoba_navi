import React from 'react';
import clsx from 'clsx';

interface MaskableSectionProps {
    isMasked: boolean;
    isHidden: boolean;
    onToggle: () => void;
    spacing?: 'none' | 'inset' | 'contentInset';
    className?: string;
    children: React.ReactNode;
}

interface MaskOverlayProps {
    isMasked: boolean;
    isHidden: boolean;
    onToggle: () => void;
}

export const MaskableSection: React.FC<MaskableSectionProps> = ({
    isMasked,
    isHidden,
    onToggle,
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
                onToggle={onToggle}
            />
            {children}
        </div>
    );
};

const MaskOverlay: React.FC<MaskOverlayProps> = ({ isMasked, isHidden, onToggle }) => {
    if (!isMasked) return null;

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            className={clsx(
                "absolute inset-0 cursor-pointer transition-colors duration-200 z-10 rounded-lg border-0 p-0 appearance-none",
                isHidden ? "bg-[#2B7FFF]" : "bg-[#2B7FFF]/20 hover:bg-[#2B7FFF]/30"
            )}
            title={isHidden ? "タップで表示" : "タップで隠す"}
            aria-label={isHidden ? "タップで表示" : "タップで隠す"}
            aria-pressed={!isHidden}
        />
    );
};
