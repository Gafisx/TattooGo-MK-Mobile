
<div align="center">
  <img src="./assets/images/banner-cover.png" alt="TattooGo MK Cover" width="100%" />
</div>

<div align="center">
  <img src="./assets/app-avatar.png" alt="TattooGo MK App Icon" width="80" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(255, 102, 0, 0.2);" />
  <br/><br/>
  <img src="https://img.shields.io/badge/PLATFORM-iOS%20%7C%20Android-blueviolet?style=for-the-badge&logo=expo" alt="Platform iOS Android">
  <img src="https://img.shields.io/badge/ENGINE-Expo%20SDK%20%2F%20React%20Native-000020?style=for-the-badge&logo=react" alt="Engine Expo">
  <img src="https://img.shields.io/badge/STATUS-ACTIVE%20DEVELOPMENT-ff6600?style=for-the-badge" alt="Status Active Development">
  <img src="https://img.shields.io/badge/ARCH-Hybrid%20Enterprise-6f42c1?style=for-the-badge" alt="Architecture Enterprise">
</div>

<!-- Badges Tech Stack Mobile Oficiais -->
<p align="center">
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NativeWind-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="NativeWind">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <br/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=black" alt="Neon DB">
  <img src="https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white" alt="Clerk">
  <img src="https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=redis&logoColor=black" alt="Upstash Redis">
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare">
</p>

---

## ⚡ TattooGo MK Mobile • Native Ecosystem & Experience

O **TattooGo MK Mobile** é a aplicação cliente e profissional desenvolvida em **React Native / Expo** para o ecossistema TattooGo MK. Projetada para entregar performance nativa, micro-interações fluidas e segurança de nível enterprise, a aplicação conecta entusiastas, artistas e estúdios em uma plataforma de descoberta visual e agendamento inteligente.

---

## 🛡️ Arquitetura Híbrida & Governança de Segurança

> **Nota de Engenharia:** Este repositório é público e dedicado exclusivamente à auditoria e apresentação da **camada de interface mobile (Front-End / UI-UX Nativa)**. O motor transacional, regras de negócio críticas, chaves de idempotência e o backend transacional operam sob blindagem restrita em repositórios privados (*Private Core*).

---

## 🏛️ Topologia de Infraestrutura & Fluxo

```mermaid
graph TD
    A[TattooGo Mobile Client / Expo] -->|HTTPS / Edge Routing| B[Cloudflare & API Gateway]
    B -->|Clerk Auth / Token Validation| C[Upstash Redis / Edge Cache]
    C -->|Private Core Engine| D[(Neon DB / PostgreSQL)]
    
    style A fill:#121212,stroke:#FF6600,stroke-width:2px,color:#fff
    style B fill:#121212,stroke:#F38020,stroke-width:2px,color:#fff
    style C fill:#121212,stroke:#00E9A3,stroke-width:2px,color:#fff
    style D fill:#121212,stroke:#00E599,stroke-width:2px,color:#fff

📱 Módulos & Experiência Mobile
 * Acesso Freemium & Descoberta Visual: Navegação aberta no feed público de inspirações e destaques para visitantes, com barreira inteligente que direciona para autenticação segura em interações avançadas e perfis completos.
 * Flash Notes Interativos: Stories efêmeros com gatilhos dinâmicos de orçamento rápido e suporte a ofertas por tempo limitado.
 * Chat Especializado & Travas Operacionais: Canais dedicados ao alinhamento de projetos entre cliente e artista, protegidos por travas de tempo e moderação automatizada para conversão segura.
 * Agendamento Inteligente & Gestão de Agenda: Sincronização em tempo real de horários confirmados após validação de pagamento e notificações programadas para experiência sem atritos.
⚖️ Compliance, Privacidade & Termos de Uso (Resumo Executivo)
O ecossistema TattooGo MK opera em estrita conformidade com a LGPD (Lei nº 13.709/2018) e padrões internacionais de proteção de dados.
 * Criptografia & Sigilo: Dados de geolocalização, credenciais de acesso e registros de agendamento são cifrados em trânsito e em repouso.
 * Verificação de Identidade: Validação de CPF obrigatória para perfis profissionais e prestadores, assegurando confiabilidade na rede.
 * Exclusão de Dados: Política transparente com carência de 90 dias para desativação definitiva e descarte seguro.
<details>
<summary><b>📄 Visualizar Termos de Uso e Política de Privacidade Completo (14 Cláusulas)</b></summary>
1. Aceitação, Natureza e Objeto
Os presentes Termos regulam o uso da plataforma TattooGo MK. A plataforma atua exclusivamente como intermediadora tecnológica entre clientes, artistas e estúdios independentes, não sendo parte executora do serviço físico de tatuagem.
2. Elegibilidade e Idade Mínima
Proibido o cadastro e uso autenticado para menores de 14 anos. Usuários entre 15 e 17 anos exigem consentimento e supervisão expressa do responsável legal, em conformidade com o Estatuto da Criança e do Adolescente (ECA).
3. Modelo Freemium
Visitantes podem navegar livremente pelo feed público, galeria e destaques. Interações sociais avançadas, visualização completa de perfis, chat, orçamentos e agendamentos exigem cadastro e autenticação de usuário.
4. Governança e Padrões Elite
Artistas e estúdios devem manter regularidade documental, profissional e sanitária. É estritamente vedada a negociação de serviços ou orçamentos fora da plataforma.
5. Chat e Travas Operacionais
Canais dedicados ao alinhamento técnico e formalização de orçamentos, protegidos por travas de tempo, validade de propostas e moderação contra fraudes ou desvio de transações.
6. Agendamento e Pagamentos
Confirmação de horários vinculada à retenção de sinal/calção e processamento seguro via gateway integrado com chaves de idempotência para evitar cobranças duplicadas.
7. Cancelamento e Reagendamento
Políticas claras com antecedência recomendada de 3 dias e limites operacionais de cancelamentos para preservação da agenda dos profissionais.
8. Conduta e Moderação por IA
Monitoramento automatizado de mensagens para coibir assédio, fraude e links externos, operando sob rigoroso dever de sigilo e finalidade exclusiva de segurança.
9. Verificação Sanitária e Documental
Responsabilidade exclusiva dos profissionais quanto a alvarás, biossegurança, assepsia e execução física do procedimento de tatuagem.
10. Proteção de Dados (LGPD/GDPR)
Tratamento restrito de dados cadastrais, geolocalização aproximada/precisa e logs para operação do marketplace, sem comercialização de informações pessoais a terceiros.
11. Propriedade Intelectual
Artistas mantêm direitos patrimoniais sobre suas obras, concedendo licença não exclusiva de exibição técnica estrita no âmbito do ecossistema digital.
12. Suspensão e Exclusão
Contas podem ser desativadas a pedido do usuário (carência de 90 dias para exclusão definitiva) ou banidas imediatamente em caso de infração grave aos termos.
13. Segurança de Conta
Uso obrigatório de credenciais seguras, autenticação em duas etapas/OTP e salvaguardas rigorosas contra impersonação.
14. Disposições Gerais
Aplicam-se as leis da República Federativa do Brasil, com foro elegível conforme a legislação de consumo aplicável.
</details>
> Status de Release (Q4/2026): Aplicação mobile em ciclo ativo de homologação de interface e refinamento de módulos nativos.
> 
<div align="center">
<sub>© 2026 Gafisx & TattooGo MK. Todos os direitos reservados. Propriedade Intelectual Protegida.</sub>
</div>


