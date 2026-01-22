import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Sparkles, Copy, Check, 
  Lightbulb, BarChart3, Zap, Target, RefreshCw,
  Globe, ChevronRight, ExternalLink, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SupportButton } from './SupportButton';
import { 
  ContentType, 
  ContentTheme, 
  GeneratedPost,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_COLORS,
  CONTENT_TYPE_ICONS 
} from '@/types/linkedin-content';

interface Stage7GuideProps {
  stageNumber: number;
}

const STEPS = [
  { id: 1, title: 'Escolher Tipo de Conteúdo', icon: Lightbulb },
  { id: 2, title: 'Colar Referência', icon: Globe },
  { id: 3, title: 'Escolher Tema', icon: Target },
  { id: 4, title: 'Gerar Conteúdo', icon: Sparkles },
  { id: 5, title: 'Copiar e Publicar', icon: Copy },
];

const CONTENT_TYPES: { type: ContentType; label: string; icon: string; description: string }[] = [
  { 
    type: 'inspiracao', 
    label: 'Inspiração', 
    icon: '✨', 
    description: 'Histórias que geram identificação e inspiram seu público' 
  },
  { 
    type: 'enquete', 
    label: 'Enquete', 
    icon: '📊', 
    description: 'Perguntas que geram engajamento e abrem conversas' 
  },
  { 
    type: 'dicas_rapidas', 
    label: 'Dicas Rápidas', 
    icon: '💡', 
    description: 'Valor rápido com estrutura problema/solução' 
  },
  { 
    type: 'como_resolver', 
    label: 'Como Resolver', 
    icon: '🎯', 
    description: 'Posiciona você como especialista - o mais poderoso!' 
  },
];

export const Stage7Guide = ({ stageNumber }: Stage7GuideProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [referenceContent, setReferenceContent] = useState('');
  const [themes, setThemes] = useState<ContentTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ContentTheme | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedPosts, setSavedPosts] = useState<GeneratedPost[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load saved posts
  useEffect(() => {
    if (user) {
      loadSavedPosts();
    }
  }, [user]);

  const loadSavedPosts = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('collected_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', 'linkedin_posts')
      .single();
    
    if (data?.data_content) {
      const content = data.data_content as unknown as { posts?: GeneratedPost[] };
      if (content.posts) {
        setSavedPosts(content.posts);
      }
    }
  };

  const savePost = async (post: GeneratedPost) => {
    if (!user) return;
    
    const updatedPosts = [...savedPosts, post];
    const dataContent = JSON.parse(JSON.stringify({ posts: updatedPosts }));
    
    // Check if record exists
    const { data: existing } = await supabase
      .from('collected_data')
      .select('id')
      .eq('user_id', user.id)
      .eq('data_type', 'linkedin_posts')
      .single();
    
    if (existing) {
      await supabase
        .from('collected_data')
        .update({
          data_content: dataContent,
          stage_number: 7,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('collected_data')
        .insert({
          user_id: user.id,
          data_type: 'linkedin_posts',
          data_content: dataContent,
          stage_number: 7,
        });
    }
    
    setSavedPosts(updatedPosts);
  };

  const analyzeContent = async () => {
    if (!referenceContent.trim()) {
      toast({
        title: 'Conteúdo vazio',
        description: 'Cole o conteúdo de referência que você encontrou na internet.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-content', {
        body: {
          action: 'analyze',
          referenceContent: referenceContent.trim(),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao analisar conteúdo');

      const analyzedThemes = data.data.themes.map((t: any, i: number) => ({
        id: `theme-${i}`,
        title: t.title,
        description: t.description,
        selected: false,
      }));

      setThemes(analyzedThemes);
      setCurrentStep(3);
      
      toast({
        title: 'Análise concluída!',
        description: `Encontrei ${analyzedThemes.length} temas para você escolher.`,
      });
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      toast({
        title: 'Erro na análise',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePost = async () => {
    if (!selectedTheme || !selectedType) return;

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-content', {
        body: {
          action: 'generate',
          contentType: selectedType,
          theme: selectedTheme.title,
          userContext: selectedTheme.description,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao gerar conteúdo');

      const newPost: GeneratedPost = {
        id: `post-${Date.now()}`,
        type: selectedType,
        headline: data.data.headline,
        content: data.data.content,
        created_at: new Date().toISOString(),
        theme: selectedTheme.title,
      };

      setGeneratedPost(newPost);
      setCurrentStep(5);
      
      // Save post automatically
      await savePost(newPost);
      
      toast({
        title: 'Post gerado!',
        description: 'Seu conteúdo está pronto para publicar no LinkedIn.',
      });
    } catch (error: any) {
      console.error('Error generating post:', error);
      toast({
        title: 'Erro ao gerar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedPost) return;
    
    const fullContent = `${generatedPost.headline}\n\n${generatedPost.content}`;
    
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Cole no LinkedIn e publique!',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione o texto manualmente.',
        variant: 'destructive',
      });
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSelectedType(null);
    setReferenceContent('');
    setThemes([]);
    setSelectedTheme(null);
    setGeneratedPost(null);
    setCopied(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Que tipo de conteúdo você quer criar?
              </h2>
              <p className="text-muted-foreground">
                Cada tipo tem um objetivo específico na sua estratégia
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {CONTENT_TYPES.map((content) => (
                <Card
                  key={content.type}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedType === content.type
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedType(content.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{content.icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{content.label}</h3>
                        <p className="text-sm text-muted-foreground">{content.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedType && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-4"
              >
                <Button onClick={() => setCurrentStep(2)} size="lg">
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground mt-4 mb-2">
                Cole um conteúdo de referência
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Encontre um artigo, post ou texto na internet sobre o tema que você quer abordar.
                A IA vai analisar e sugerir novos temas baseados nele.
              </p>
            </div>

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Como encontrar um bom conteúdo:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Pesquise no Google um tema da sua área</li>
                      <li>Abra um artigo ou post interessante</li>
                      <li>Copie o texto (sem links de venda)</li>
                      <li>Cole aqui abaixo</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Textarea
              value={referenceContent}
              onChange={(e) => setReferenceContent(e.target.value)}
              placeholder="Cole aqui o conteúdo que você encontrou na internet..."
              className="min-h-[200px] text-base"
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                onClick={analyzeContent} 
                disabled={isAnalyzing || !referenceContent.trim()}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar e Sugerir Temas
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground mt-4 mb-2">
                Escolha um tema para seu post
              </h2>
              <p className="text-muted-foreground">
                A IA analisou o conteúdo e sugeriu esses temas. Escolha o que mais te interessa.
              </p>
            </div>

            <div className="grid gap-3">
              {themes.map((theme) => (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all ${
                    selectedTheme?.id === theme.id
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedTheme?.id === theme.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedTheme?.id === theme.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{theme.title}</h4>
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)} 
                disabled={!selectedTheme}
                size="lg"
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground mt-4 mb-2">
                Pronto para gerar seu post?
              </h2>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <span className="text-4xl">{CONTENT_TYPE_ICONS[selectedType!]}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Tema escolhido:</h3>
                <p className="text-xl font-bold text-primary mb-2">{selectedTheme?.title}</p>
                <p className="text-muted-foreground">{selectedTheme?.description}</p>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                onClick={generatePost} 
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gerando post...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Post com IA
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                <Check className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Seu post está pronto! 🎉
              </h2>
              <p className="text-muted-foreground">
                Copie o conteúdo e publique no LinkedIn
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                    {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
                  </Badge>
                  <Button
                    variant={copied ? 'default' : 'outline'}
                    size="sm"
                    onClick={copyToClipboard}
                    className={copied ? 'bg-green-600' : ''}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" /> Copiar tudo
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  <p className="font-bold text-lg mb-4">{generatedPost?.headline}</p>
                  <p>{generatedPost?.content}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={resetFlow}>
                <RefreshCw className="mr-2 h-4 w-4" /> Criar outro post
              </Button>
              <Button 
                onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')}
                className="bg-[#0077B5] hover:bg-[#006699]"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir LinkedIn
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="font-semibold">Etapa 7: Esteira de Conteúdos</h1>
              <p className="text-sm text-muted-foreground">Crie posts estratégicos para o LinkedIn</p>
            </div>
          </div>
          <SupportButton />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 text-center max-w-[80px] ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Saved Posts Section */}
      {savedPosts.length > 0 && currentStep === 1 && (
        <div className="max-w-4xl mx-auto px-4 py-8 border-t">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Seus posts salvos ({savedPosts.length})
          </h3>
          <div className="grid gap-3">
            {savedPosts.slice(-5).reverse().map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge className={CONTENT_TYPE_COLORS[post.type]} variant="outline">
                        {CONTENT_TYPE_ICONS[post.type]} {CONTENT_TYPE_LABELS[post.type]}
                      </Badge>
                      <p className="font-medium mt-2 line-clamp-2">{post.headline}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${post.headline}\n\n${post.content}`);
                        toast({ title: 'Copiado!' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
