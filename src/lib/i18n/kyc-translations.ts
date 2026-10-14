import type { Translations } from './types';

/**
 * Camada de i18n do KYC do tatuador e da Agenda do estúdio.
 *
 * Mesclada em `getMessages()` — o contrato de fallback continua o mesmo:
 * locale ativo -> `en` -> própria chave.
 *
 * Chaves dinâmicas resolvidas em runtime:
 *  - `kyc.<KycStatus>.title` / `kyc.<KycStatus>.message`
 */
export const kycTranslations: Translations = {
  'pt-BR': {
    'kyc.blockTitle': 'Verificação de identidade',
    'kyc.signOut': 'Sair da conta',
    'kyc.pendente.title': 'Verificação pendente',
    'kyc.pendente.message':
      'Envie os seus documentos para iniciar a análise. Até lá, o painel do estúdio permanece bloqueado.',
    'kyc.em_analise.title': 'Análise em andamento',
    'kyc.em_analise.message':
      'Estamos analisando os seus documentos. Isso costuma levar até 48 horas.',
    'kyc.rejeitado.title': 'Verificação rejeitada',
    'kyc.rejeitado.message':
      'Não foi possível aprovar os seus documentos. Revise os dados e envie novamente.',
    'kyc.aprovado.title': 'Verificação aprovada',
    'kyc.aprovado.message': 'A sua conta está verificada. Bem-vindo ao painel do estúdio.',
    'kyc.nao_aplicavel.title': 'Acesso de tatuador necessário',
    'kyc.nao_aplicavel.message':
      'Esta área é exclusiva para tatuadores e estúdios verificados.',
    'studio.agenda.title': 'Agenda do estúdio',
    'studio.agenda.subtitle': 'As suas sessões de hoje e o que vem a seguir',
    'studio.agenda.today': 'Hoje',
    'studio.agenda.upcoming': 'Próximos',
    'studio.agenda.empty.title': 'Nenhuma sessão agendada',
    'studio.agenda.empty.description': 'Quando um cliente agendar uma sessão, ela aparece aqui.',
  },
  'pt-PT': {
    'kyc.blockTitle': 'Verificação de identidade',
    'kyc.signOut': 'Terminar sessão',
    'kyc.pendente.title': 'Verificação pendente',
    'kyc.pendente.message':
      'Envia os teus documentos para iniciar a análise. Até lá, o painel do estúdio permanece bloqueado.',
    'kyc.em_analise.title': 'Análise em curso',
    'kyc.em_analise.message':
      'Estamos a analisar os teus documentos. Isto costuma demorar até 48 horas.',
    'kyc.rejeitado.title': 'Verificação rejeitada',
    'kyc.rejeitado.message':
      'Não foi possível aprovar os teus documentos. Revê os dados e envia novamente.',
    'kyc.aprovado.title': 'Verificação aprovada',
    'kyc.aprovado.message': 'A tua conta está verificada. Bem-vindo ao painel do estúdio.',
    'kyc.nao_aplicavel.title': 'Acesso de tatuador necessário',
    'kyc.nao_aplicavel.message':
      'Esta área é exclusiva para tatuadores e estúdios verificados.',
    'studio.agenda.title': 'Agenda do estúdio',
    'studio.agenda.subtitle': 'As tuas sessões de hoje e o que vem a seguir',
    'studio.agenda.today': 'Hoje',
    'studio.agenda.upcoming': 'Próximos',
    'studio.agenda.empty.title': 'Nenhuma sessão agendada',
    'studio.agenda.empty.description': 'Quando um cliente marcar uma sessão, ela aparece aqui.',
  },
  en: {
    'kyc.blockTitle': 'Identity verification',
    'kyc.signOut': 'Sign out',
    'kyc.pendente.title': 'Verification pending',
    'kyc.pendente.message':
      'Submit your documents to start the review. Until then, your studio dashboard stays locked.',
    'kyc.em_analise.title': 'Verification in progress',
    'kyc.em_analise.message':
      'We are reviewing your documents. This usually takes up to 48 hours.',
    'kyc.rejeitado.title': 'Verification rejected',
    'kyc.rejeitado.message':
      "We couldn't approve your documents. Review the details and submit again.",
    'kyc.aprovado.title': 'Verification approved',
    'kyc.aprovado.message': 'Your account is verified. Welcome to your studio dashboard.',
    'kyc.nao_aplicavel.title': 'Artist access required',
    'kyc.nao_aplicavel.message':
      'This area is exclusive to verified artists and studios.',
    'studio.agenda.title': 'Studio agenda',
    'studio.agenda.subtitle': 'Your sessions for today and what is coming next',
    'studio.agenda.today': 'Today',
    'studio.agenda.upcoming': 'Upcoming',
    'studio.agenda.empty.title': 'No sessions scheduled',
    'studio.agenda.empty.description': 'When a client books a session, it shows up here.',
  },
  es: {
    'kyc.blockTitle': 'Verificación de identidad',
    'kyc.signOut': 'Cerrar sesión',
    'kyc.pendente.title': 'Verificación pendiente',
    'kyc.pendente.message':
      'Envía tus documentos para iniciar la revisión. Hasta entonces, el panel del estudio permanece bloqueado.',
    'kyc.em_analise.title': 'Verificación en curso',
    'kyc.em_analise.message':
      'Estamos revisando tus documentos. Suele tardar hasta 48 horas.',
    'kyc.rejeitado.title': 'Verificación rechazada',
    'kyc.rejeitado.message':
      'No pudimos aprobar tus documentos. Revisa los datos y envíalos de nuevo.',
    'kyc.aprovado.title': 'Verificación aprobada',
    'kyc.aprovado.message': 'Tu cuenta está verificada. Bienvenido al panel del estudio.',
    'kyc.nao_aplicavel.title': 'Se requiere acceso de artista',
    'kyc.nao_aplicavel.message':
      'Esta área es exclusiva para artistas y estudios verificados.',
    'studio.agenda.title': 'Agenda del estudio',
    'studio.agenda.subtitle': 'Tus sesiones de hoy y lo que viene después',
    'studio.agenda.today': 'Hoy',
    'studio.agenda.upcoming': 'Próximas',
    'studio.agenda.empty.title': 'Sin sesiones programadas',
    'studio.agenda.empty.description': 'Cuando un cliente reserve una sesión, aparecerá aquí.',
  },
  fr: {
    'kyc.blockTitle': "Vérification d'identité",
    'kyc.signOut': 'Se déconnecter',
    'kyc.pendente.title': 'Vérification en attente',
    'kyc.pendente.message':
      "Envoyez vos documents pour lancer l'examen. D'ici là, votre tableau de bord studio reste verrouillé.",
    'kyc.em_analise.title': 'Vérification en cours',
    'kyc.em_analise.message':
      "Nous examinons vos documents. Cela prend généralement jusqu'à 48 heures.",
    'kyc.rejeitado.title': 'Vérification refusée',
    'kyc.rejeitado.message':
      "Nous n'avons pas pu approuver vos documents. Vérifiez les données et envoyez-les à nouveau.",
    'kyc.aprovado.title': 'Vérification approuvée',
    'kyc.aprovado.message':
      'Votre compte est vérifié. Bienvenue dans votre tableau de bord studio.',
    'kyc.nao_aplicavel.title': 'Accès artiste requis',
    'kyc.nao_aplicavel.message':
      'Cet espace est réservé aux artistes et studios vérifiés.',
    'studio.agenda.title': 'Agenda du studio',
    'studio.agenda.subtitle': "Vos séances d'aujourd'hui et les suivantes",
    'studio.agenda.today': "Aujourd'hui",
    'studio.agenda.upcoming': 'À venir',
    'studio.agenda.empty.title': 'Aucune séance planifiée',
    'studio.agenda.empty.description':
      "Quand un client réserve une séance, elle apparaît ici.",
  },
  de: {
    'kyc.blockTitle': 'Identitätsprüfung',
    'kyc.signOut': 'Abmelden',
    'kyc.pendente.title': 'Prüfung ausstehend',
    'kyc.pendente.message':
      'Sende deine Unterlagen ein, um die Prüfung zu starten. Bis dahin bleibt dein Studio-Dashboard gesperrt.',
    'kyc.em_analise.title': 'Prüfung läuft',
    'kyc.em_analise.message':
      'Wir prüfen deine Unterlagen. Das dauert in der Regel bis zu 48 Stunden.',
    'kyc.rejeitado.title': 'Prüfung abgelehnt',
    'kyc.rejeitado.message':
      'Wir konnten deine Unterlagen nicht genehmigen. Prüfe die Angaben und reiche sie erneut ein.',
    'kyc.aprovado.title': 'Prüfung genehmigt',
    'kyc.aprovado.message': 'Dein Konto ist verifiziert. Willkommen in deinem Studio-Dashboard.',
    'kyc.nao_aplicavel.title': 'Künstlerzugang erforderlich',
    'kyc.nao_aplicavel.message':
      'Dieser Bereich ist verifizierten Künstlern und Studios vorbehalten.',
    'studio.agenda.title': 'Studio-Termine',
    'studio.agenda.subtitle': 'Deine Sitzungen für heute und was als Nächstes kommt',
    'studio.agenda.today': 'Heute',
    'studio.agenda.upcoming': 'Demnächst',
    'studio.agenda.empty.title': 'Keine Sitzungen geplant',
    'studio.agenda.empty.description':
      'Wenn ein Kunde eine Sitzung bucht, erscheint sie hier.',
  },
  it: {
    'kyc.blockTitle': "Verifica dell'identità",
    'kyc.signOut': 'Esci',
    'kyc.pendente.title': 'Verifica in sospeso',
    'kyc.pendente.message':
      'Invia i tuoi documenti per avviare la revisione. Fino ad allora, la dashboard dello studio resta bloccata.',
    'kyc.em_analise.title': 'Verifica in corso',
    'kyc.em_analise.message':
      'Stiamo esaminando i tuoi documenti. Di solito richiede fino a 48 ore.',
    'kyc.rejeitado.title': 'Verifica rifiutata',
    'kyc.rejeitado.message':
      'Non abbiamo potuto approvare i tuoi documenti. Controlla i dati e inviali di nuovo.',
    'kyc.aprovado.title': 'Verifica approvata',
    'kyc.aprovado.message': 'Il tuo account è verificato. Benvenuto nella dashboard dello studio.',
    'kyc.nao_aplicavel.title': 'Accesso artista richiesto',
    'kyc.nao_aplicavel.message':
      'Questa area è riservata ad artisti e studi verificati.',
    'studio.agenda.title': 'Agenda dello studio',
    'studio.agenda.subtitle': 'Le tue sessioni di oggi e le prossime',
    'studio.agenda.today': 'Oggi',
    'studio.agenda.upcoming': 'Prossime',
    'studio.agenda.empty.title': 'Nessuna sessione pianificata',
    'studio.agenda.empty.description':
      'Quando un cliente prenota una sessione, compare qui.',
  },
  ja: {
    'kyc.blockTitle': '本人確認',
    'kyc.signOut': 'サインアウト',
    'kyc.pendente.title': '確認待ち',
    'kyc.pendente.message':
      '書類を提出して審査を開始してください。それまでスタジオのダッシュボードはロックされます。',
    'kyc.em_analise.title': '審査中',
    'kyc.em_analise.message': '書類を確認しています。通常48時間ほどかかります。',
    'kyc.rejeitado.title': '確認が却下されました',
    'kyc.rejeitado.message':
      '書類を承認できませんでした。内容を確認して再度提出してください。',
    'kyc.aprovado.title': '確認が承認されました',
    'kyc.aprovado.message':
      'アカウントが確認されました。スタジオのダッシュボードへようこそ。',
    'kyc.nao_aplicavel.title': 'アーティスト権限が必要です',
    'kyc.nao_aplicavel.message':
      'このエリアは認証済みのアーティストとスタジオ専用です。',
    'studio.agenda.title': 'スタジオの予定',
    'studio.agenda.subtitle': '今日のセッションと今後の予定',
    'studio.agenda.today': '今日',
    'studio.agenda.upcoming': '今後',
    'studio.agenda.empty.title': '予定されたセッションはありません',
    'studio.agenda.empty.description':
      'クライアントがセッションを予約すると、ここに表示されます。',
  },
  zh: {
    'kyc.blockTitle': '身份验证',
    'kyc.signOut': '退出登录',
    'kyc.pendente.title': '待验证',
    'kyc.pendente.message': '请提交您的文件以开始审核。在此之前，工作室面板将保持锁定。',
    'kyc.em_analise.title': '正在审核',
    'kyc.em_analise.message': '我们正在审核您的文件。通常需要最多 48 小时。',
    'kyc.rejeitado.title': '验证被拒绝',
    'kyc.rejeitado.message': '我们无法通过您的文件。请检查信息并重新提交。',
    'kyc.aprovado.title': '验证已通过',
    'kyc.aprovado.message': '您的账户已验证。欢迎来到工作室面板。',
    'kyc.nao_aplicavel.title': '需要纹身师权限',
    'kyc.nao_aplicavel.message': '此区域仅供已验证的纹身师和工作室使用。',
    'studio.agenda.title': '工作室日程',
    'studio.agenda.subtitle': '您今天的会话以及接下来的安排',
    'studio.agenda.today': '今天',
    'studio.agenda.upcoming': '接下来',
    'studio.agenda.empty.title': '暂无预约会话',
    'studio.agenda.empty.description': '当客户预约会话时，它会显示在这里。',
  },
  ko: {
    'kyc.blockTitle': '본인 확인',
    'kyc.signOut': '로그아웃',
    'kyc.pendente.title': '확인 대기 중',
    'kyc.pendente.message':
      '문서를 제출하여 심사를 시작하세요. 그때까지 스튜디오 대시보드는 잠겨 있습니다.',
    'kyc.em_analise.title': '심사 진행 중',
    'kyc.em_analise.message': '문서를 검토하고 있습니다. 보통 최대 48시간이 걸립니다.',
    'kyc.rejeitado.title': '확인 거부됨',
    'kyc.rejeitado.message': '문서를 승인할 수 없습니다. 정보를 확인하고 다시 제출하세요.',
    'kyc.aprovado.title': '확인 승인됨',
    'kyc.aprovado.message': '계정이 확인되었습니다. 스튜디오 대시보드에 오신 것을 환영합니다.',
    'kyc.nao_aplicavel.title': '아티스트 권한 필요',
    'kyc.nao_aplicavel.message': '이 영역은 인증된 아티스트와 스튜디오 전용입니다.',
    'studio.agenda.title': '스튜디오 일정',
    'studio.agenda.subtitle': '오늘의 세션과 다음 일정',
    'studio.agenda.today': '오늘',
    'studio.agenda.upcoming': '예정',
    'studio.agenda.empty.title': '예약된 세션이 없습니다',
    'studio.agenda.empty.description': '고객이 세션을 예약하면 여기에 표시됩니다.',
  },
  ar: {
    'kyc.blockTitle': 'التحقق من الهوية',
    'kyc.signOut': 'تسجيل الخروج',
    'kyc.pendente.title': 'التحقق معلّق',
    'kyc.pendente.message':
      'أرسل مستنداتك لبدء المراجعة. حتى ذلك الحين تبقى لوحة الاستوديو مقفلة.',
    'kyc.em_analise.title': 'التحقق قيد التنفيذ',
    'kyc.em_analise.message': 'نراجع مستنداتك. يستغرق ذلك عادةً حتى 48 ساعة.',
    'kyc.rejeitado.title': 'تم رفض التحقق',
    'kyc.rejeitado.message': 'لم نتمكن من اعتماد مستنداتك. راجع البيانات وأعد الإرسال.',
    'kyc.aprovado.title': 'تم اعتماد التحقق',
    'kyc.aprovado.message': 'تم التحقق من حسابك. مرحبًا بك في لوحة الاستوديو.',
    'kyc.nao_aplicavel.title': 'مطلوب صلاحية فنان',
    'kyc.nao_aplicavel.message':
      'هذه المنطقة مخصصة للفنانين والاستوديوهات الموثّقة.',
    'studio.agenda.title': 'جدول الاستوديو',
    'studio.agenda.subtitle': 'جلساتك لهذا اليوم وما هو قادم',
    'studio.agenda.today': 'اليوم',
    'studio.agenda.upcoming': 'القادمة',
    'studio.agenda.empty.title': 'لا توجد جلسات مجدولة',
    'studio.agenda.empty.description': 'عندما يحجز عميل جلسة، تظهر هنا.',
  },
  ru: {
    'kyc.blockTitle': 'Проверка личности',
    'kyc.signOut': 'Выйти',
    'kyc.pendente.title': 'Проверка ожидается',
    'kyc.pendente.message':
      'Отправьте документы, чтобы начать проверку. До этого панель студии останется заблокированной.',
    'kyc.em_analise.title': 'Проверка выполняется',
    'kyc.em_analise.message':
      'Мы проверяем ваши документы. Обычно это занимает до 48 часов.',
    'kyc.rejeitado.title': 'Проверка отклонена',
    'kyc.rejeitado.message':
      'Не удалось одобрить документы. Проверьте данные и отправьте снова.',
    'kyc.aprovado.title': 'Проверка одобрена',
    'kyc.aprovado.message': 'Ваш аккаунт подтверждён. Добро пожаловать в панель студии.',
    'kyc.nao_aplicavel.title': 'Требуется доступ мастера',
    'kyc.nao_aplicavel.message':
      'Этот раздел доступен только проверенным мастерам и студиям.',
    'studio.agenda.title': 'Расписание студии',
    'studio.agenda.subtitle': 'Ваши сеансы на сегодня и ближайшие',
    'studio.agenda.today': 'Сегодня',
    'studio.agenda.upcoming': 'Ближайшие',
    'studio.agenda.empty.title': 'Нет запланированных сеансов',
    'studio.agenda.empty.description':
      'Когда клиент запишется на сеанс, он появится здесь.',
  },
  hi: {
    'kyc.blockTitle': 'पहचान सत्यापन',
    'kyc.signOut': 'साइन आउट',
    'kyc.pendente.title': 'सत्यापन लंबित',
    'kyc.pendente.message':
      'समीक्षा शुरू करने के लिए अपने दस्तावेज़ भेजें। तब तक आपका स्टूडियो डैशबोर्ड लॉक रहेगा।',
    'kyc.em_analise.title': 'सत्यापन प्रगति पर',
    'kyc.em_analise.message':
      'हम आपके दस्तावेज़ों की समीक्षा कर रहे हैं। इसमें आमतौर पर 48 घंटे तक लगते हैं।',
    'kyc.rejeitado.title': 'सत्यापन अस्वीकृत',
    'kyc.rejeitado.message':
      'हम आपके दस्तावेज़ों को स्वीकृत नहीं कर सके। विवरण जाँचें और फिर से भेजें।',
    'kyc.aprovado.title': 'सत्यापन स्वीकृत',
    'kyc.aprovado.message': 'आपका खाता सत्यापित है। आपके स्टूडियो डैशबोर्ड में स्वागत है।',
    'kyc.nao_aplicavel.title': 'कलाकार पहुँच आवश्यक',
    'kyc.nao_aplicavel.message':
      'यह क्षेत्र केवल सत्यापित कलाकारों और स्टूडियो के लिए है।',
    'studio.agenda.title': 'स्टूडियो एजेंडा',
    'studio.agenda.subtitle': 'आज के आपके सत्र और आगे क्या है',
    'studio.agenda.today': 'आज',
    'studio.agenda.upcoming': 'आगामी',
    'studio.agenda.empty.title': 'कोई सत्र निर्धारित नहीं',
    'studio.agenda.empty.description': 'जब कोई ग्राहक सत्र बुक करता है, तो वह यहाँ दिखता है।',
  },
  nl: {
    'kyc.blockTitle': 'Identiteitsverificatie',
    'kyc.signOut': 'Afmelden',
    'kyc.pendente.title': 'Verificatie in behandeling',
    'kyc.pendente.message':
      'Dien je documenten in om de controle te starten. Tot die tijd blijft je studiobord vergrendeld.',
    'kyc.em_analise.title': 'Verificatie loopt',
    'kyc.em_analise.message': 'We controleren je documenten. Dit duurt meestal tot 48 uur.',
    'kyc.rejeitado.title': 'Verificatie afgewezen',
    'kyc.rejeitado.message':
      'We konden je documenten niet goedkeuren. Controleer de gegevens en dien opnieuw in.',
    'kyc.aprovado.title': 'Verificatie goedgekeurd',
    'kyc.aprovado.message': 'Je account is geverifieerd. Welkom bij je studiobord.',
    'kyc.nao_aplicavel.title': 'Artiesttoegang vereist',
    'kyc.nao_aplicavel.message':
      "Dit gedeelte is exclusief voor geverifieerde artiesten en studio's.",
    'studio.agenda.title': 'Studio-agenda',
    'studio.agenda.subtitle': 'Je sessies van vandaag en wat er daarna komt',
    'studio.agenda.today': 'Vandaag',
    'studio.agenda.upcoming': 'Aankomend',
    'studio.agenda.empty.title': 'Geen sessies gepland',
    'studio.agenda.empty.description':
      'Wanneer een klant een sessie boekt, verschijnt die hier.',
  },
  tr: {
    'kyc.blockTitle': 'Kimlik doğrulama',
    'kyc.signOut': 'Çıkış yap',
    'kyc.pendente.title': 'Doğrulama bekliyor',
    'kyc.pendente.message':
      'İncelemeyi başlatmak için belgelerinizi gönderin. O zamana kadar stüdyo paneliniz kilitli kalır.',
    'kyc.em_analise.title': 'Doğrulama sürüyor',
    'kyc.em_analise.message':
      'Belgelerinizi inceliyoruz. Bu genellikle 48 saate kadar sürer.',
    'kyc.rejeitado.title': 'Doğrulama reddedildi',
    'kyc.rejeitado.message':
      'Belgelerinizi onaylayamadık. Bilgileri gözden geçirip yeniden gönderin.',
    'kyc.aprovado.title': 'Doğrulama onaylandı',
    'kyc.aprovado.message': 'Hesabınız doğrulandı. Stüdyo panelinize hoş geldiniz.',
    'kyc.nao_aplicavel.title': 'Sanatçı erişimi gerekli',
    'kyc.nao_aplicavel.message':
      'Bu alan yalnızca doğrulanmış sanatçılar ve stüdyolar içindir.',
    'studio.agenda.title': 'Stüdyo ajandası',
    'studio.agenda.subtitle': 'Bugünkü seanslarınız ve sıradakiler',
    'studio.agenda.today': 'Bugün',
    'studio.agenda.upcoming': 'Yaklaşan',
    'studio.agenda.empty.title': 'Planlanmış seans yok',
    'studio.agenda.empty.description':
      'Bir müşteri seans ayarladığında burada görünür.',
  },
  pl: {
    'kyc.blockTitle': 'Weryfikacja tożsamości',
    'kyc.signOut': 'Wyloguj',
    'kyc.pendente.title': 'Weryfikacja oczekuje',
    'kyc.pendente.message':
      'Prześlij dokumenty, aby rozpocząć weryfikację. Do tego czasu panel studia pozostanie zablokowany.',
    'kyc.em_analise.title': 'Weryfikacja w toku',
    'kyc.em_analise.message':
      'Sprawdzamy Twoje dokumenty. Zwykle zajmuje to do 48 godzin.',
    'kyc.rejeitado.title': 'Weryfikacja odrzucona',
    'kyc.rejeitado.message':
      'Nie udało się zatwierdzić dokumentów. Sprawdź dane i wyślij ponownie.',
    'kyc.aprovado.title': 'Weryfikacja zatwierdzona',
    'kyc.aprovado.message': 'Twoje konto jest zweryfikowane. Witaj w panelu studia.',
    'kyc.nao_aplicavel.title': 'Wymagany dostęp artysty',
    'kyc.nao_aplicavel.message':
      'Ten obszar jest przeznaczony wyłącznie dla zweryfikowanych artystów i studiów.',
    'studio.agenda.title': 'Terminarz studia',
    'studio.agenda.subtitle': 'Twoje dzisiejsze sesje i to, co dalej',
    'studio.agenda.today': 'Dzisiaj',
    'studio.agenda.upcoming': 'Nadchodzące',
    'studio.agenda.empty.title': 'Brak zaplanowanych sesji',
    'studio.agenda.empty.description':
      'Gdy klient zarezerwuje sesję, pojawi się tutaj.',
  },
};
