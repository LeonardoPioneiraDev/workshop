// src/api/manos.ts
export async function fetchManOs(filters: any) {
  // Ajuste o body de acordo com o que sua API espera
  const response = await fetch("http://localhost:3024/oracle-extract/os-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filters),
  });

  if (!response.ok) throw new Error("Erro ao buscar OS");

  // Caso a resposta siga seu padrão: { data: [...], count: n }
  return await response.json();
}