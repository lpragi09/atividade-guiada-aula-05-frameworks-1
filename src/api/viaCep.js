// src/api/viaCep.js
import axios from 'axios';

const viaCepApi = axios.create({
  baseURL: 'https://viacep.com.br/ws',
});

export const getAddressByCep = async (cep) => {
  const response = await viaCepApi.get(`/${cep}/json/`);
  if (response.data.erro) {
    throw new Error('CEP não encontrado.');
  }
  return response.data;
};
