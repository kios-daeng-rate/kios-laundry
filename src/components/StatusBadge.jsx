import { getStatusColor } from '../data/dummyData';

export default function StatusBadge({ status }) {
    const colors = getStatusColor(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {status}
        </span>
    );
}
