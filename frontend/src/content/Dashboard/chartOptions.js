export default function getChartOptions(title, axesTitle, isDark) {

    const Options = {
        title: title,
        theme: isDark ? 'g90' : 'white',
        axes: {
            left: {
                title: axesTitle,
                mapsTo: 'value'
            },
            bottom: {
                mapsTo: 'title',
                scaleType: 'labels'
            }
        },
        bars: {
            width: 30,
            maxWidth: 50,
        },
        color: {
            scale: {
                "bx2d(Current)": isDark ? `var(--cds-charts-2-2-1)` : `var(--cds-charts-3-3-2)`,
                "bx3d(Current)": isDark ? `var(--cds-charts-3-2-2)` : `var(--cds-charts-2-3-1)`,
                "bx2d(Max)": isDark ? `var(--cds-charts-2-5-2)` : `var(--cds-charts-2-2-1)`,
                "bx3d(Max)": isDark ? `var(--cds-charts-2-4-1)` : `var(--cds-charts-2-2-2)`,
            }
        },
        height: '400px'
    };
    return Options;
}