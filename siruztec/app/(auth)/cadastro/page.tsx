"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Create tenant record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("tenants").insert({
        owner_id: user.id,
        name,
        plan: "startup",
        status: "trial",
      });
    }

    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-white">🏢 SiruzTec</Link>
          <p className="text-zinc-400 mt-2">Crie sua empresa em 5 minutos</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 space-y-4">
            <div className="bg-violet-900/30 border border-violet-800 rounded-lg p-3 text-sm text-violet-300">
              ✨ 7 dias grátis — sem cartão de crédito
            </div>

            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Seu nome</label>
                <Input
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Senha</label>
                <Input
                  type="password"
                  placeholder="mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  minLength={8}
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-base py-5" disabled={loading}>
                {loading ? "Criando sua empresa..." : "Ativar minha empresa →"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">Entrar</Link>
        </p>
        <p className="text-center text-zinc-600 text-xs mt-3">
          Ao criar sua conta você concorda com os Termos de Uso.
        </p>
      </div>
    </div>
  );
}
