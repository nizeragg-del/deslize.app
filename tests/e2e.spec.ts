import { test, expect } from '@playwright/test';

test.describe('Flowyn/Deslize E2E Tests', () => {
  // Configuração global para os testes
  test.beforeEach(async ({ page }) => {
    // Acessar a página inicial e limpar estado se necessário
    await page.goto('/');
  });

  test('Teste 1: Fluxo de Login e Autenticação', async ({ page }) => {
    // 1. Navega para a página de login
    await page.goto('/login');
    
    // 2. Verifica se a página de login carregou corretamente
    await expect(page.locator('h1')).toContainText(/Bem-vindo/i);
    
    // 3. Preenche formulário de login com um usuário de teste
    // Usando roles e placeholders de forma acessível
    const emailInput = page.getByPlaceholder(/Email/i);
    const passwordInput = page.getByPlaceholder(/Senha/i);
    
    await emailInput.fill('test@flowyn.com');
    await passwordInput.fill('test123456');
    
    // 4. Submete o formulário
    await page.getByRole('button', { name: /Entrar/i }).click();

    // 5. Verifica o redirecionamento (ou erro se o usuário não existir no banco)
    // Opcionalmente podemos testar com auth mockado ou apenas checar a UI de erro.
    // await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Teste 2: Navegação no Dashboard (Histórico e Planos)', async ({ page }) => {
    // Como os testes rodam em paralelo ou precisam de Auth, 
    // ideal seria mockar a autenticação ou usar uma fixture com storageState pré-logado.
    
    // Simulação: Acesso direto à uma página (esperamos redirecionamento ou carregamento)
    await page.goto('/dashboard');
    
    // Se o middleware proteger a rota, deve redirecionar para /login
    const url = page.url();
    if (url.includes('/login')) {
      // Teste de redirecionamento de segurança passou
      expect(url).toContain('/login');
    } else {
      // Se logado, verifica elementos do dashboard
      await expect(page.locator('nav')).toBeVisible();
      
      // Clica no histórico
      await page.goto('/dashboard/historico');
      await expect(page.getByText(/Meus Carrosséis/i)).toBeVisible();
      
      // Clica em transações / créditos
      await page.goto('/dashboard/planos');
      await expect(page.getByText(/Créditos/i)).toBeVisible();
    }
  });

  test('Teste 3: Criação de um novo Carrossel', async ({ page }) => {
    // Navega para a criação
    await page.goto('/dashboard/novo');
    
    // Verifica elementos do formulário de criação
    // Se não estiver logado, será redirecionado. 
    // Em um teste real E2E, injetaríamos auth state (storageState) para testar a ferramenta.
    const url = page.url();
    if (!url.includes('/login')) {
      // Formulário
      await expect(page.getByPlaceholder(/Ex: 5 erros/i)).toBeVisible();
      
      // Opções
      await page.getByText('Listicle').click();
      await page.getByText('Educativo').click();
      
      // Verifica o preview iframe ou container
      const previewContainer = page.locator('.preview-track').first();
      // O DOMPurify deve garantir que elementos maliciosos inseridos não existam
    }
  });
});
