const SUAP_AUTH_URL = 'https://suap.ifpr.edu.br/o/authorize/';
const SUAP_USER_URL = 'https://suap.ifpr.edu.br/api/eu/';

export const gerarUrlLoginSuap = () => {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: process.env.SUAP_CLIENT_ID,
    redirect_uri: process.env.SUAP_REDIRECT_URI,
  });

  return `${SUAP_AUTH_URL}?${params.toString()}`;
};


export const consultarUsuarioSuap = async (accessToken) => {
  if (!accessToken) {
    throw new Error('Access token do SUAP não fornecido.');
  }

  const response = await fetch(SUAP_USER_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  const texto = await response.text();

  console.log('Resposta do SUAP:');
  console.log('Status:', response.status);
  console.log('Body:', texto);

  if (!response.ok) {
    throw new Error(
      `SUAP respondeu ${response.status}: ${texto}`
    );
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      `SUAP respondeu com conteúdo que não é JSON: ${texto}`
    );
  }
};