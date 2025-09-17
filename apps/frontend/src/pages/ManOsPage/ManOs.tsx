import { useEffect, useState } from "react";
import { ManOsFilters } from "../../components/ManOsFilters/ManOsFilters";
import { ManOsTable } from "../../components/ManOsTable/ManOsTable";
import { fetchManOs } from "../../services/manos";

export function ManOs() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    origens: [],
    garagens: [],
    limit: 100,
    useSimpleQuery: true,
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);

  async function loadData(filterParams = filters) {
    setLoading(true);
    try {
      const res = await fetchManOs(filterParams);
      setData(res.data);
      setCount(res.count);
    } catch (err) {
      // Aqui você pode tratar o erro para mostrar feedback ao usuário
      setData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(next) {
    setFilters(next);
    loadData(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <ManOsFilters value={filters} onChange={handleFilterChange} />
      <ManOsTable data={data} loading={loading} />
    </div>
  );
}