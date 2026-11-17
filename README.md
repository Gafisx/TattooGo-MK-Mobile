<div align="center">
  <img src="./assets/images/banner-cover.png" alt="TattooGo MK Cover" width="100%" />
</div>

<div align="center">
  <table align="center" style="border: none; background: transparent;">
    <tr>
      <td align="center" style="border: none; background: transparent; vertical-align: middle; padding-right: 15px;">
        <img src="./assets/images/app-avatar.png" alt="TattooGo MK App Icon" width="85" style="border-radius: 18px;" />
      </td>
      <td align="left" style="border: none; background: transparent; vertical-align: middle;">
        <img src="https://img.shields.io/badge/PLATFORM-iOS%20%7C%20Android-blueviolet?style=for-the-badge&logo=expo" alt="Platform iOS Android"><br/>
        <img src="https://img.shields.io/badge/ENGINE-Expo%20SDK%20%2F%20React%20Native-000020?style=for-the-badge&logo=react" alt="Engine Expo"><br/>
        <img src="https://img.shields.io/badge/STATUS-ACTIVE%20DEVELOPMENT-ff6600?style=for-the-badge" alt="Status Active"><br/>
        <img src="https://img.shields.io/badge/ARCH-Hybrid%20Enterprise-6f42c1?style=for-the-badge" alt="Architecture Enterprise">
      </td>
    </tr>
  </table>

  <br/>

  <table align="center">
    <tr>
      <td align="center" style="background-color:#111111; border:1px solid #FF6600; border-radius:14px; padding:10px 18px;">
        <a href="#"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" height="40"></a>
      </td>
      <td width="18" style="border:none; background:transparent;"></td>
      <td align="center" style="background-color:#111111; border:1px solid #FF6600; border-radius:14px; padding:10px 18px;">
        <a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" height="40"></a>
      </td>
    </tr>
  </table>
  <p align="center"><sub>Private Beta / Q4 Release</sub></p>
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

## TattooGo MK Mobile • Native Ecosystem & Experience

O **TattooGo MK Mobile** é a aplicação cliente e profissional desenvolvida em **React Native / Expo** para o ecossistema TattooGo MK. Projetada para entregar performance nativa, micro-interações fluidas e segurança de nível enterprise, a aplicação conecta entusiastas, artistas e estúdios em uma plataforma de descoberta visual e agendamento inteligente.

---

## Arquitetura Híbrida & Governança de Segurança

> **Nota de Engenharia:** Este repositório é público e dedicado exclusivamente à auditoria e apresentação da **camada de interface mobile (Front-End / UI-UX Nativa)**. O motor transacional, regras de negócio críticas, chaves de idempotência e o backend transacional operam sob blindagem restrita em repositórios privados (*Private Core*).

---


## Topologia de Infraestrutura & Fluxo

```mermaid
flowchart TD
    A["TattooGo Mobile Client"]
    B["Cloudflare Gateway"]
    C["Clerk Auth Validation"]
    D["Upstash Redis Cache"]
    E["Private Core Engine"]
    F[("Neon DB PostgreSQL")]

    A -->|"HTTPS / TLS"| B
    B -->|"Authentication Request"| C
    C -->|"Validated Session"| D
    D -->|"Authorized Request"| E
    E -->|"Database Connection"| F

    style A fill:#121212,stroke:#FF6600,stroke-width:2px,color:#ffffff
    style B fill:#121212,stroke:#F38020,stroke-width:2px,color:#ffffff
    style C fill:#121212,stroke:#00E9A3,stroke-width:2px,color:#ffffff
    style D fill:#121212,stroke:#00E599,stroke-width:2px,color:#ffffff
    style E fill:#121212,stroke:#00E9A3,stroke-width:2px,color:#ffffff
    style F fill:#121212,stroke:#00E599,stroke-width:2px,color:#ffffff
```

---

## Modulos & Experiencia Mobile

* **Acesso Freemium & Descoberta Visual:** Navegação aberta no feed público de inspirações e destaques para visitantes, com barreira inteligente que direciona para autenticação segura em interações avançadas e perfis completos.
* **Flash Notes Interativos:** Stories efêmeros com gatilhos dinâmicos de orçamento rápido e suporte a ofertas por tempo limitado.
* **Chat Especializado & Travas Operacionais:** Canais dedicados ao alinhamento de projetos entre cliente e artista, protegidos por travas de tempo e moderação automatizada para conversão segura.
* **Agendamento Inteligente & Gestão de Agenda:** Sincronização em tempo real de horários confirmados após validação de pagamento e notificações programadas para experiência sem atritos.

---

## Compliance, Privacidade & Termos de Uso (Portal Legal)

O ecossistema TattooGo MK opera em estrita conformidade com a LGPD (Lei nº 13.709/2018) e padrões internacionais de proteção de dados.

<div style="background-color: #161616; border: 1px solid #FF6600; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
<details>
<summary><b><span style="color: #FF6600; font-size: 1.1em;">Toque para abrir os Termos de Uso e Política de Privacidade (14 Cláusulas)</span></b></summary>

<hr style="border-color: #333;" />

<p><b>1. Aceitação, Natureza e Objeto</b></p>
<p>Os presentes Termos regulam o uso do ecossistema TattooGo MK. A plataforma atua exclusivamente como intermediadora tecnológica entre clientes, artistas e estúdios independentes, não sendo parte executora do serviço físico de tatuagem.</p>

<hr style="border-color: #222;" />

<p><b>2. Elegibilidade e Idade Mínima</b></p>
<p>Proibido o cadastro e uso autenticado para menores de 14 anos. Usuários entre 15 e 17 anos exigem consentimento e supervisão expressa do responsável legal, em conformidade com o Estatuto da Criança e do Adolescente (ECA).</p>

<hr style="border-color: #222;" />

<p><b>3. Modelo Freemium</b></p>
<p>Visitantes podem navegar livremente pelo feed público, galeria e destaques. Interações sociais avançadas, visualização completa de perfis, chat, orçamentos e agendamentos exigem cadastro e autenticação de usuário.</p>

<hr style="border-color: #222;" />

<p><b>4. Governança e Padrões Elite</b></p>
<p>Artistas e estúdios devem manter regularidade documental, profissional e sanitária. É estritamente vedada a negociação de serviços ou orçamentos fora da plataforma.</p>

<hr style="border-color: #222;" />

<p><b>5. Chat e Travas Operacionais</b></p>
<p>Canais dedicados ao alinhamento técnico e formalização de orçamentos, protegidos por travas de tempo, validade de propostas e moderação automatizada contra fraudes ou desvio de transações.</p>

<hr style="border-color: #222;" />

<p><b>6. Agendamento e Pagamentos</b></p>
<p>Confirmação de horários vinculada à retenção de sinal/calção e processamento seguro via gateway integrado com chaves de idempotência para evitar cobranças duplicadas.</p>

<hr style="border-color: #222;" />

<p><b>7. Cancelamento e Reagendamento</b></p>
<p>Políticas transparentes com antecedência recomendada de 3 dias e limites operacionais de cancelamentos para preservação da agenda dos profissionais.</p>

<hr style="border-color: #222;" />

<p><b>8. Conduta e Moderação por IA</b></p>
<p>Monitoramento automatizado de mensagens para coibir assédio, fraude e links externos, operando sob rigoroso dever de sigilo e finalidade exclusiva de segurança.</p>

<hr style="border-color: #222;" />

<p><b>9. Verificação Sanitária e Documental</b></p>
<p>Responsabilidade exclusiva dos profissionais quanto a alvarás, biossegurança, assepsia e execução física do procedimento de tatuagem.</p>

<hr style="border-color: #222;" />

<p><b>10. Proteção de Dados (LGPD/GDPR)</b></p>
<p>Tratamento restrito de dados cadastrais, geolocalização aproximada/precisa e logs para operação do marketplace, sem comercialização de informações pessoais a terceiros.</p>

<hr style="border-color: #222;" />

<p><b>11. Propriedade Intelectual</b></p>
<p>Artistas mantêm direitos patrimoniais sobre suas obras, concedendo licença não exclusiva de exibição técnica estrita no âmbito do ecossistema digital.</p>

<hr style="border-color: #222;" />

<p><b>12. Suspensão e Exclusão</b></p>
<p>Contas podem ser desativadas a pedido do usuário (carência de 90 dias para exclusão definitiva) ou banidas imediatamente em caso de infração grave aos termos.</p>

<hr style="border-color: #222;" />

<p><b>13. Segurança de Conta</b></p>
<p>Uso obrigatório de credenciais seguras, autenticação em duas etapas/OTP e salvaguardas rigorosas contra impersonação.</p>

<hr style="border-color: #222;" />

<p><b>14. Disposições Gerais</b></p>
<p>Aplicam-se as leis da República Federativa do Brasil, elegendo o foro conforme a legislação de consumo aplicável.</p>

</details>
</div>

> Status de Release (Q4/2026): Aplicação mobile em ciclo ativo de homologação de interface e refinamento de módulos nativos.

<div align="center">
<sub>© 2026 Gafisx & TattooGo MK. Todos os direitos reservados. Propriedade Intelectual Protegida.</sub>
</div>
