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

  if (!response.ok) {
    const texto = await response.text();

    throw new Error(
      `Erro ao consultar usuário no SUAP: ${response.status} ${texto}`
    );
  }

  return await response.json();
};