import React from 'react';

interface HideToggleProps {
    checked: boolean;
    onChange: () => void;
}

export const HideToggle: React.FC<HideToggleProps> = ({ checked, onChange }) => (
    <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
        <span className="text-[10px] text-gray-500 font-normal">隠す</span>
        <div className="relative inline-flex items-center">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={onChange}
            />
            <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2B7FFF]"></div>
        </div>
    </label>
);
