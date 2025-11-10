// src/utils/styleUtils.ts
export function getCssVariableValue(variableName: string): string {
  // Garante que a função só execute no lado do cliente, onde 'document' está disponível
  if (typeof window === "undefined") {
    return "#000000"; // Cor de fallback para SSR ou se a variável não for encontrada
  }
  // Remove o 'var()' se ele for passado acidentalmente e garante que comece com '--'
  const cleanVariableName = variableName.replace(/var\(|\)/g, "").trim();
  const finalVariableName = cleanVariableName.startsWith("--")
    ? cleanVariableName
    : `--${cleanVariableName}`;

  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(finalVariableName)
      .trim();
    return value || "#000000"; // Retorna preto se o valor for uma string vazia
  } catch (error) {
    console.warn(
      `[getCssVariableValue] Erro ao obter variável ${finalVariableName}:`,
      error,
    );
    return "#000000"; // Fallback em caso de erro
  }
}
