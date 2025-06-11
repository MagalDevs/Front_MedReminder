# How to Fix the 400 Bad Request Error in MedReminder App

## Issue
The medication reminder app is encountering a 400 Bad Request error when trying to save medication doses. While the medication records are being successfully created in the database, the subsequent API call to save doses is failing.

## Fix Instructions

1. Open the file: `src/app/components/CardCadastrar/cardCadastrar.tsx`

2. Find the `dadosDoses` object creation (around line 430):
   ```typescript
   const dadosDoses = {
     usuarioId: usuarioId, // This property is causing issues
     remedioId: typeof remedioId === 'string' ? Number(remedioId) : remedioId,
     doses: dosesISO
   };
   ```

3. Replace it with this modified version:
   ```typescript
   // Converter o remedioId para número e garantir que esteja no formato correto
   const remedioIdNumber = typeof remedioId === 'string' ? parseInt(remedioId) : remedioId;
   
   // Criar o objeto no formato exato esperado pela API
   const dadosDoses = {
     remedioId: remedioIdNumber,
     doses: dosesISO.map(dose => dose.trim()) // Garantir que não há espaços extras
   };
   ```

4. Remove any redundant code that's re-converting the `remedioId` later in the file, as it's already converted when creating the object.

5. Ensure the `dosesISO` array is properly formatted by sorting it chronologically (optional but helps with consistency):
   ```typescript
   // Ordenar as doses cronologicamente para garantir consistência
   dosesISO.sort();
   ```

6. Fix TypeScript errors in the `limparFormulario` function by adding type checks:
   ```typescript
   const limparFormulario = () => {
     if (typeof setNome === 'function') setNome('');
     if (typeof setDosagem === 'function') setDosagem('');
     if (typeof setTipo === 'function') setTipo('');
     if (typeof setCorSelecionada === 'function') setCorSelecionada('#FF0000');
     if (typeof setHorarios === 'function') setHorarios([{ data: new Date().toISOString().split('T')[0], hora: '10:00', dose: '1 comp.' }]);
     if (typeof setMotivo === 'function') setMotivo('');
     if (typeof setDuracao === 'function') setDuracao('');
     if (typeof setQuantidade === 'function') setQuantidade('');
     if (typeof setValidade === 'function') setValidade(null);
     if (typeof setDataValidade === 'function') setDataValidade('');
     if (typeof setIntervalo === 'function') setIntervalo('');
     if (typeof setObservacoes === 'function') setObservacoes('');
     if (typeof setErros === 'function') setErros({});
   };
   ```

7. Add additional error logging in the catch block to help diagnose the issue:
   ```typescript
   if (error.message.toLowerCase().includes('invalid') || 
       error.message.toLowerCase().includes('invalid input') ||
       error.message.toLowerCase().includes('formato') ||
       error.message.toLowerCase().includes('400')) {
     console.error('Possível erro de formato nos dados enviados:', dadosDoses);
     console.error('Tipos de dados - remedioId:', typeof dadosDoses.remedioId);
     console.error('Tipos de dados - doses[0]:', typeof dadosDoses.doses[0]);
     mensagemErro += ". Pode haver um problema com o formato dos dados enviados.";
   }
   ```

8. Test the application to verify the changes have fixed the issue.

## Why This Fixes the Issue
The main problem was that the API expected a specific format for the request body. By removing the `usuarioId` property and ensuring the `remedioId` is a number, we match the expected format for the API, which resolves the 400 Bad Request error.
