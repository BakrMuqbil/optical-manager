import React from 'react';
import type { ReactNode } from "react";

interface CardGridProps {
    children: ReactNode;
    columns?: 1 | 2 | 3 | 4 | 5;
    className?: string;
}

export function CardGrid({
    children,
    columns = 5,
    className = ""
}: CardGridProps) {
    const gridColumns =
        columns === 1
            ? "grid-cols-1"
            : columns === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : columns === 3
                ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

    return (
        <div className={`grid gap-4 ${gridColumns} ${className}`.trim()}>
            {children}
        </div>
    );
}
