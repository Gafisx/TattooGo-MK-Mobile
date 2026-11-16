<div align="center">

  <img src="./assets/images/banner-cover.png" alt="TattooGo MK Mobile Cover" width="100%" />

  <br/><br/>

  <!-- Avatar Oficial do App & Crachás de Plataforma / Lojas -->
  <p align="center">
    <img src="./assets/app-avatar_2.png" alt="TattooGo MK App Icon" width="80" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(255, 102, 0, 0.2);" />
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/STATUS-ACTIVE%20DEVELOPMENT-success?style=for-the-badge&color=ff6600" alt="Status Active">
    <img src="https://img.shields.io/badge/PLATFORM-iOS%20%7C%20ANDROID-blueviolet?style=for-the-badge&logo=android&logoColor=white" alt="Platforms">
    <img src="https://img.shields.io/badge/ENGINE-EXPO%20%2F%20REACT%20NATIVE-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
    <img src="https://img.shields.io/badge/RELEASE-Q4%2F2026-blue?style=for-the-badge" alt="Release Q4">
  </p>

  <!-- Botões Estilizados das Lojas Oficiais -->
  <p align="center">
    <img src="https://img.shields.io/badge/App_Store-000000?style=for-the-badge&logo=app-store&logoColor=white" alt="App Store">
    &nbsp;&nbsp;
    <img src="https://img.shields.io/badge/Google_Play-000000?style=for-the-badge&logo=google-play&logoColor=white" alt="Google Play">
  </p>

  # TattooGo MK &bull; Mobile Experience & Native Ecosystem
  
  <p align="center">
    <em>Ecossistema mobile de alta performance conectando estúdios, artistas independentes e entusiastas da arte na pele.</em>
  </p>

  <!-- Badges Tech Stack Mobile Oficiais -->
  <p align="center">
    <img src="https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native">
    <img src="https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/NativeWind-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="NativeWind">
    <br/>
    <img src="https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white" alt="Clerk Auth">
    <img src="https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=black" alt="Neon DB">
    <img src="https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=redis&logoColor=black" alt="Upstash Redis">
    <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare">
  </p>

</div>

---

## ⚡ Sobre o Ecossistema Mobile

O **TattooGo MK Mobile** é a aplicação nativa de alta performance do ecossistema Gafisx Labs. Projetada sob rigorosos padrões de UI/UX, a plataforma oferece uma experiência fluida de bolso para descoberta artística, gestão de portfólios, interações sociais imersivas e fluxos seguros de agendamento entre clientes e tatuadores.

---

## 🛡️ Padrão de Engenharia & Arquitetura Híbrida

> **Nota de Arquitetura:** Para garantir a proteção rigorosa de nossa propriedade intelectual e regras de negócio críticas, este repositório adota visibilidade híbrida:
> * **Front-End Mobile Público:** Disponibilizado para auditoria de interface, experiência nativa (*UX/UI*) e padrão de código de apresentação.
> * **Core & Backend Privado:** O motor transacional, lógica de split de pagamentos, chaves de idempotência e regras de segurança operam sob blindagem restrita (*Private Core*).

---

## 🏛️ Visão Geral da Arquitetura

```mermaid
graph TD
    A[TattooGo Mobile App / Expo] -->|API Gateway & Edge| B[Clerk Auth & Upstash Cache]
    B -->|Secure Transmit| C[Private Core Engine & Neon DB]
    style A fill:#FF6600,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#6F42C1,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#007ACC,stroke:#fff,stroke-width:2px,color:#fff
