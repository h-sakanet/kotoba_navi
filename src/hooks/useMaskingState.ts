import { useCallback, useState } from 'react';

export type PanelSide = 'left' | 'right';
export type MaskStateValue = 'opaque' | 'transparent';
export type MaskStates = Record<string, MaskStateValue>;

export const useMaskingState = () => {
    const [hideLeft, setHideLeft] = useState(false);
    const [hideRight, setHideRight] = useState(false);
    const [maskStates, setMaskStates] = useState<MaskStates>({});

    const toggleMaskForSide = useCallback((side: PanelSide) => {
        const isActive = side === 'left' ? hideLeft : hideRight;
        if (!isActive) {
            setHideLeft(side === 'left');
            setHideRight(side === 'right');
            setMaskStates({});
            return;
        }

        if (side === 'left') setHideLeft(false);
        if (side === 'right') setHideRight(false);
    }, [hideLeft, hideRight]);

    const toggleLeft = useCallback(() => toggleMaskForSide('left'), [toggleMaskForSide]);
    const toggleRight = useCallback(() => toggleMaskForSide('right'), [toggleMaskForSide]);

    const handleSheetClick = useCallback((maskKey: string) => {
        setMaskStates(prev => {
            const current = prev[maskKey] || 'opaque';
            return {
                ...prev,
                [maskKey]: current === 'opaque' ? 'transparent' : 'opaque'
            };
        });
    }, []);

    const resetMasking = useCallback(() => {
        setHideLeft(false);
        setHideRight(false);
        setMaskStates({});
    }, []);

    return {
        hideLeft,
        hideRight,
        maskStates,
        isAnyMaskActive: hideLeft || hideRight,
        toggleLeft,
        toggleRight,
        handleSheetClick,
        resetMasking
    };
};
