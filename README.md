<div align="center">
<img src="./assets/images/banner-cover.png" alt="TattooGo MK Cover" width="100%" />
</div>
<div align="center">
<table align="center" border="0" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding-right: 15px; vertical-align: middle;">
<img src="./assets/images/app-avatar.png" alt="TattooGo MK App Icon" width="70" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(255, 102, 0, 0.4);" />
</td>
<td align="left" style="vertical-align: middle;">
<img src="[https://img.shields.io/badge/PLATFORM-iOS%20%7C%20Android-blueviolet?style=for-the-badge&logo=expo](https://img.shields.io/badge/PLATFORM-iOS%20%7C%20Android-blueviolet?style=for-the-badge&logo=expo)" alt="Platform iOS Android">

<img src="[https://img.shields.io/badge/ENGINE-Expo%20SDK%20%2F%20React%20Native-000020?style=for-the-badge&logo=react](https://img.shields.io/badge/ENGINE-Expo%20SDK%20%2F%20React%20Native-000020?style=for-the-badge&logo=react)" alt="Engine Expo">

<img src="[https://img.shields.io/badge/STATUS-ACTIVE%20DEVELOPMENT-ff6600?style=for-the-badge](https://img.shields.io/badge/STATUS-ACTIVE%20DEVELOPMENT-ff6600?style=for-the-badge)" alt="Status Active Development">
</td>
</tr>
</table>


<a href="#"><img src="[https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)" alt="App Store" height="38"></a>
  
<a href="#"><img src="[https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg](https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg)" alt="Google Play" height="38"></a>
</div>
<!-- Badges Tech Stack Mobile Oficiais -->
<p align="center">
<img src="[https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black](https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black)" alt="React Native">
<img src="[https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)" alt="Expo">
<img src="[https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)" alt="TypeScript">
<img src="[https://img.shields.io/badge/NativeWind-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white](https://img.shields.io/badge/NativeWind-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)" alt="NativeWind">
<img src="[https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)" alt="Node.js">


<img src="[https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)" alt="Prisma">
<img src="[https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=black](https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=black)" alt="Neon DB">
<img src="[https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white](https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white)" alt="Clerk">
<img src="[https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=redis&logoColor=black](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=redis&logoColor=black)" alt="Upstash Redis">
<img src="[https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)" alt="Cloudflare">
</p>
⚡ TattooGo MK Mobile • Native Ecosystem & Experience
O TattooGo MK Mobile é a aplicação cliente e profissional desenvolvida em React Native / Expo para o ecossistema TattooGo MK. Projetada para entregar performance nativa, micro-interações fluidas e segurança de nível enterprise, a aplicação conecta entusiastas, artistas e estúdios em uma plataforma de descoberta visual e agendamento inteligente.
🛡️ Arquitetura Híbrida & Governança de Segurança
Nota de Engenharia: Este repositório é público e dedicado exclusivamente à auditoria e apresentação da camada de interface mobile (Front-End / UI-UX Nativa). O motor transacional, regras de negócio críticas, chaves de idempotência e o backend transacional operam sob blindagem restrita em repositórios privados (Private Core).
🏛️ Topologia de Infraestrutura & Fluxo
graph TD
    A[TattooGo Mobile Client / Expo] -->|HTTPS / Edge Routing| B[Cloudflare & API Gateway]
    B -->|Clerk Auth / Token Validation| C[Upstash Redis / Edge Cache]
    C -->|Private Core Engine| D[(Neon DB / PostgreSQL)]
    
    style A fill:#121212,stroke:#FF6600,stroke-width:2px,color:#fff
    style B fill:#121212,stroke:#F38020,stroke-width:2px,color:#fff
    style C fill:#121212,stroke:#00E9A3,stroke-width:2px,color:#fff
    style D fill:#121212,stroke:#00E599,stroke-width:2px,color:#fff

📱 Módulos & Experiência Mobile
Acesso Freemium & Descoberta Visual: Navegação aberta no feed público de inspirações e destaques para visitantes, com barreira inteligente que direciona para autenticação segura em interações avançadas e perfis completos.
Flash Notes Interativos: Stories efêmeros com gatilhos dinâmicos de orçamento rápido e suporte a ofertas por tempo limitado.
Chat Especializado & Travas Operacionais: Canais dedicados ao alinhamento de projetos entre cliente e artista, protegidos por travas de tempo e moderação automatizada para conversão segura.
Agendamento Inteligente & Gestão de Agenda: Sincronização em tempo real de horários confirmados após validação de pagamento e notificações programadas para experiência sem atritos.
⚖️ Termos de Uso e Política de Privacidade (Portal Legal)
O ecossistema TattooGo MK opera em conformidade com a LGPD e padrões enterprise de segurança.
<details>
<summary><b>📄 <span style="color: #FF6600;">Abrir Termos de Uso e Política de Privacidade (Versão 3.0 Oficial)</span></b></summary>
1. Natureza e Objeto: A plataforma atua como intermediadora tecnológica conectando clientes, artistas e estúdios independentes, não executando diretamente o serviço físico de tatuagem.
2. Elegibilidade: Proibido para menores de 14 anos. Menores entre 15 e 17 anos exigem consentimento e supervisão expressa do responsável legal (ECA).
3. Modelo Freemium: Navegação livre no feed público para visitantes. Interações sociais, perfis completos, chat, orçamentos e agendamentos exigem autenticação.
4. Governança Elite: Artistas e estúdios mantêm regularidade documental e sanitária. É vedada a negociação de serviços fora da plataforma.
5. Chat e Travas: Canais dedicados ao alinhamento técnico e orçamentos, protegidos por travas de tempo, validade de propostas e moderação antifraude.
6. Pagamentos e Sinal: Horários vinculados à retenção de calção/sinal e processamento seguro via gateway integrado com idempotência contra duplicidade.
7. Cancelamentos: Políticas transparentes com antecedência recomendada de 3 dias e limites operacionais de cancelamento para preservação da agenda.
8. Moderação por IA: Monitoramento automatizado de mensagens para coibir assédio e fraude, sob sigilo e finalidade exclusiva de segurança operacional.
9. Responsabilidade Sanitária: Responsabilidade exclusiva dos profissionais quanto a alvarás, biossegurança e execução física dos procedimentos.
10. Proteção de Dados (LGPD): Tratamento restrito de dados cadastrais, geolocalização e logs, sem comercialização de informações pessoais a terceiros.
11. Propriedade Intelectual: Artistas mantêm direitos patrimoniais sobre suas obras, concedendo licença de exibição técnica no ecossistema digital.
12. Exclusão de Contas: Contas podem ser desativadas a pedido (carência de 90 dias para exclusão definitiva) ou banidas por infração grave aos termos.
13. Segurança de Credenciais: Uso obrigatório de credenciais seguras, autenticação em duas etapas/OTP e salvaguardas contra impersonação.
14. Disposições Gerais: Aplicam-se as leis da República Federativa do Brasil, elegendo o foro conforme a legislação de consumo aplicável.
</details>
Status de Release (Q4/2026): Aplicação mobile em ciclo ativo de homologação de interface e refinamento de módulos nativos.
<div align="center">
<sub>© 2026 Gafisx & TattooGo MK. Todos os direitos reservados. Propriedade Intelectual Protegida.</sub>
</div>
