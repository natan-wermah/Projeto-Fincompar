import React from 'react';
import AuthScreen from '../../screens/AuthScreen';
import { supabase } from '../lib/supabaseClient';

const AuthPage = () => {
  const handleLogin = async (email: string, name?: string, password?: string) => {
    if (!password) {
      alert('Senha obrigatória')
      return
    }

    if (name) {
      // Cadastro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      if (error) {
        alert('Erro ao criar conta: ' + error.message)
      } else {
        alert('Conta criada com sucesso!')
        // Redirecionar para dashboard ou salvar sessão
      }
    } else {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert('Erro ao fazer login: ' + error.message)
      } else {
        alert('Login realizado com sucesso!')
        // Redirecionar para dashboard
      }
    }
  }

  return <AuthScreen onLogin={handleLogin} />
}

export default AuthPage
