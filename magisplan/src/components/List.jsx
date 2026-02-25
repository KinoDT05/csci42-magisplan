export default function List({data = [] }) {
    const numCols = columns.length;

    return (
        <ul>
            {data.map((t) => (
                <li key={t.id}>
                    {t.id}: {t.desc}
                </li>
            ))}
        </ul>
    );
}