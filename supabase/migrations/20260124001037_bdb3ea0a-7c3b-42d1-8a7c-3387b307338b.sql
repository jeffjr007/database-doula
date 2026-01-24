-- Tornar o bucket privado
UPDATE storage.buckets 
SET public = false 
WHERE id = 'mentee-files';

-- Remover políticas públicas existentes
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for mentee files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view mentee files" ON storage.objects;

-- Política: Usuários podem ver apenas seus próprios arquivos
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mentee-files' 
  AND (
    -- Usuário acessa sua própria pasta
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admin pode ver todos os arquivos
    public.has_role(auth.uid(), 'admin')
  )
);

-- Política: Admins podem fazer upload de arquivos
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mentee-files' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Política: Admins podem atualizar arquivos
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mentee-files' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Política: Admins podem deletar arquivos
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mentee-files' 
  AND public.has_role(auth.uid(), 'admin')
);