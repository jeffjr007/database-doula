import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Sparkles, Copy, Check, 
  Lightbulb, BarChart3, Zap, Target, RefreshCw,
  Globe, ChevronRight, ExternalLink, BookOpen, PenLine, Pencil, Save, Eye, Trash2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HelpCircle } from 'lucide-react';
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

// Animation variants (same as GupyGuide)
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const STEPS = [
  { id: 1, title: 'Escolher Tipo', icon: Lightbulb },
  { id: 2, title: 'Criar Tema', icon: PenLine },
  { id: 3, title: 'Escolher Tema', icon: Target },
  { id: 4, title: 'Gerar Conteúdo', icon: Sparkles },
  { id: 5, title: 'Publicar', icon: Copy },
];

const CONTENT_TYPES: { type: ContentType; label: string; Icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { 
    type: 'inspiracao', 
    label: 'Inspiração', 
    Icon: Sparkles, 
    description: 'Histórias que geram identificação e inspiram seu público' 
  },
  { 
    type: 'enquete', 
    label: 'Enquete', 
    Icon: BarChart3, 
    description: 'Perguntas que geram engajamento e abrem conversas' 
  },
  { 
    type: 'dicas_rapidas', 
    label: 'Dicas Rápidas', 
    Icon: Lightbulb, 
    description: 'Valor rápido com estrutura problema/solução' 
  },
  { 
    type: 'como_resolver', 
    label: 'Como Resolver', 
    Icon: Target, 
    description: 'Posiciona você como especialista - o mais poderoso!' 
  },
];

export const Stage7Guide = ({ stageNumber }: Stage7GuideProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [inputMode, setInputMode] = useState<'paste' | 'type'>('paste');
  const [referenceContent, setReferenceContent] = useState('');
  const [manualTheme, setManualTheme] = useState('');
  const [themes, setThemes] = useState<ContentTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ContentTheme | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedPosts, setSavedPosts] = useState<GeneratedPost[]>([]);
  const [viewingPost, setViewingPost] = useState<GeneratedPost | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostHeadline, setEditPostHeadline] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Scroll to top when step changes
  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToTop();
  }, [currentStep]);

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

  const generateFromManualTheme = async () => {
    if (!manualTheme.trim()) {
      toast({
        title: 'Tema vazio',
        description: 'Digite o tema ou ideia que você quer desenvolver.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-content', {
        body: {
          action: 'generate',
          contentType: selectedType,
          theme: manualTheme.trim(),
          manualInput: true,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao gerar conteúdo');

      const newPost: GeneratedPost = {
        id: `post-${Date.now()}`,
        type: selectedType!,
        headline: data.data.headline,
        content: data.data.content,
        created_at: new Date().toISOString(),
        theme: manualTheme,
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
    setInputMode('paste');
    setReferenceContent('');
    setManualTheme('');
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
            key="step-1"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center mb-8"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.h2 
                variants={staggerItem}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Que tipo de conteúdo você quer criar?
              </motion.h2>
              <motion.p 
                variants={staggerItem}
                className="text-muted-foreground"
              >
                Cada tipo tem um objetivo específico na sua estratégia
              </motion.p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {CONTENT_TYPES.map((content, index) => (
                <motion.div
                  key={content.type}
                  variants={staggerItem}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg h-full ${
                      selectedType === content.type
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(content.type)}
                  >
                    <CardContent className="p-6 h-full flex items-start gap-4">
                      <motion.div 
                        className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0"
                        animate={selectedType === content.type ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <content.Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-2">{content.label}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{content.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <AnimatePresence>
              {selectedType && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center pt-4"
                >
                  <Button onClick={() => setCurrentStep(2)} size="lg" className="gap-2">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step-2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center mb-6"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={staggerItem}>
                <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                  {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
                </Badge>
              </motion.div>
              <motion.h2 
                variants={staggerItem}
                className="text-2xl font-bold text-foreground mt-4 mb-2"
              >
                Como você quer criar seu conteúdo?
              </motion.h2>
              <motion.p 
                variants={staggerItem}
                className="text-muted-foreground"
              >
                Escolha entre colar uma referência ou digitar sua própria ideia
              </motion.p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'paste' | 'type')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="paste" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Colar da Internet
                  </TabsTrigger>
                  <TabsTrigger value="type" className="gap-2">
                    <PenLine className="h-4 w-4" />
                    Digitar Tema
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="paste" className="space-y-4">
                    <motion.div
                      key="paste-content"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
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

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <Button 
                          onClick={analyzeContent} 
                          disabled={isAnalyzing || !referenceContent.trim()}
                          size="lg"
                          className="gap-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Analisar e Sugerir Temas
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="type" className="space-y-4">
                    <motion.div
                      key="type-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <PenLine className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium mb-1">Digite seu tema ou ideia</h4>
                              <p className="text-sm text-muted-foreground">
                                Escreva sobre o que você quer falar. A IA vai desenvolver um post completo com formatação profissional.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">Seu tema ou ideia:</label>
                        <Textarea
                          value={manualTheme}
                          onChange={(e) => setManualTheme(e.target.value)}
                          placeholder="Ex: Como desenvolver líderes na indústria 4.0, 5 erros que gestores cometem em reuniões, A importância de feedbacks construtivos..."
                          className="min-h-[120px] text-base"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Dica: Seja específico! Quanto mais detalhes, melhor será o conteúdo gerado.
                        </p>
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <Button 
                          onClick={generateFromManualTheme} 
                          disabled={isGenerating || !manualTheme.trim()}
                          size="lg"
                          className="gap-2 bg-gradient-to-r from-primary to-accent"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Gerando post...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Gerar Post Direto
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step-3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center mb-6"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={staggerItem}>
                <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                  {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
                </Badge>
              </motion.div>
              <motion.h2 
                variants={staggerItem}
                className="text-2xl font-bold text-foreground mt-4 mb-2"
              >
                Escolha um tema para seu post
              </motion.h2>
              <motion.p 
                variants={staggerItem}
                className="text-muted-foreground"
              >
                A IA analisou o conteúdo e sugeriu esses temas. Escolha o que mais te interessa.
              </motion.p>
            </motion.div>

            <motion.div 
              className="grid gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {themes.map((theme, index) => (
                <motion.div
                  key={theme.id}
                  variants={staggerItem}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedTheme?.id === theme.id
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTheme(theme)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedTheme?.id === theme.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}
                          animate={selectedTheme?.id === theme.id ? { scale: [1, 1.2, 1] } : {}}
                        >
                          {selectedTheme?.id === theme.id && <Check className="h-3 w-3 text-white" />}
                        </motion.div>
                        <div>
                          <h4 className="font-medium">{theme.title}</h4>
                          <p className="text-sm text-muted-foreground">{theme.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="flex justify-between pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)} 
                disabled={!selectedTheme}
                size="lg"
                className="gap-2"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step-4"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center mb-6"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={staggerItem}>
                <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                  {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
                </Badge>
              </motion.div>
              <motion.h2 
                variants={staggerItem}
                className="text-2xl font-bold text-foreground mt-4 mb-2"
              >
                Pronto para gerar seu post?
              </motion.h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-6 text-center">
                  <motion.div 
                    className="mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <span className="text-5xl">{CONTENT_TYPE_ICONS[selectedType!]}</span>
                  </motion.div>
                  <h3 className="font-semibold text-lg mb-2">Tema escolhido:</h3>
                  <p className="text-xl font-bold text-primary mb-2">{selectedTheme?.title}</p>
                  <p className="text-muted-foreground">{selectedTheme?.description}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div 
              className="flex justify-between pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                onClick={generatePost} 
                disabled={isGenerating}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando post...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Post com IA
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step-5"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Check className="h-8 w-8 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Seu post está pronto! 🎉
              </h2>
              <p className="text-muted-foreground">
                Copie o conteúdo e publique no LinkedIn
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={CONTENT_TYPE_COLORS[selectedType!]}>
                      {CONTENT_TYPE_ICONS[selectedType!]} {CONTENT_TYPE_LABELS[selectedType!]}
                    </Badge>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Headline</label>
                        <Input
                          value={editedHeadline}
                          onChange={(e) => setEditedHeadline(e.target.value)}
                          className="font-bold text-lg"
                          placeholder="Headline do post..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Conteúdo</label>
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[200px] text-sm leading-relaxed"
                          placeholder="Conteúdo do post..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedHeadline(generatedPost?.headline || '');
                            setEditedContent(generatedPost?.content || '');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={async () => {
                            if (generatedPost) {
                              const updatedPost = {
                                ...generatedPost,
                                headline: editedHeadline,
                                content: editedContent,
                              };
                              setGeneratedPost(updatedPost);
                              
                              // Update saved posts
                              const updatedPosts = savedPosts.map(p => 
                                p.id === updatedPost.id ? updatedPost : p
                              );
                              setSavedPosts(updatedPosts);
                              
                              // Save to database
                              if (user) {
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
                                      data_content: JSON.parse(JSON.stringify({ posts: updatedPosts })),
                                    })
                                    .eq('id', existing.id);
                                }
                              }
                              
                              setIsEditing(false);
                              toast({
                                title: 'Post atualizado!',
                                description: 'Suas alterações foram salvas.',
                              });
                            }
                          }}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" /> Salvar alterações
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditedHeadline(generatedPost?.headline || '');
                          setEditedContent(generatedPost?.content || '');
                          setIsEditing(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
                        <p className="font-bold text-lg mb-4">{generatedPost?.headline}</p>
                        <p>{generatedPost?.content}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div 
              className="flex justify-center gap-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button variant="outline" onClick={resetFlow} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Criar outro post
              </Button>
              <Button 
                onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')}
                className="bg-[#0077B5] hover:bg-[#006699] gap-2 text-white"
              >
                <ExternalLink className="h-4 w-4" /> Abrir LinkedIn
              </Button>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" ref={contentRef}>
      {/* Header */}
      <motion.div 
        className="border-b bg-background/95 backdrop-blur sticky top-0 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="text-center">
            <h1 className="font-semibold">Etapa 7: Esteira de Conteúdos</h1>
            <p className="text-sm text-muted-foreground">Crie posts estratégicos para o LinkedIn</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/suporte')}
            className="text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div 
          className="flex items-center justify-between mb-8 overflow-x-auto pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </motion.div>
                  <span className={`text-xs mt-2 text-center max-w-[70px] ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <motion.div 
                    className={`w-8 md:w-12 h-0.5 mx-1 md:mx-2 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Saved Posts Section */}
      <AnimatePresence>
        {savedPosts.length > 0 && currentStep === 1 && (
          <motion.div 
            className="max-w-4xl mx-auto px-4 py-8 border-t"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Seus posts salvos ({savedPosts.length})
            </h3>
            <motion.div 
              className="grid gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {savedPosts.slice().reverse().map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={staggerItem}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {editingPostId === post.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Headline</label>
                            <Input
                              value={editPostHeadline}
                              onChange={(e) => setEditPostHeadline(e.target.value)}
                              className="font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Conteúdo</label>
                            <Textarea
                              value={editPostContent}
                              onChange={(e) => setEditPostContent(e.target.value)}
                              className="min-h-[150px] text-sm"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingPostId(null)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              size="sm"
                              onClick={async () => {
                                const updatedPosts = savedPosts.map(p => 
                                  p.id === post.id 
                                    ? { ...p, headline: editPostHeadline, content: editPostContent }
                                    : p
                                );
                                setSavedPosts(updatedPosts);
                                
                                if (user) {
                                  const { data: existing } = await supabase
                                    .from('collected_data')
                                    .select('id')
                                    .eq('user_id', user.id)
                                    .eq('data_type', 'linkedin_posts')
                                    .maybeSingle();
                                  
                                  if (existing) {
                                    await supabase
                                      .from('collected_data')
                                      .update({
                                        data_content: JSON.parse(JSON.stringify({ posts: updatedPosts })),
                                      })
                                      .eq('id', existing.id);
                                  }
                                }
                                
                                setEditingPostId(null);
                                toast({ title: 'Post atualizado!' });
                              }}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" /> Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
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
                          <div className="flex gap-1">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingPost(post)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditPostHeadline(post.headline);
                                  setEditPostContent(post.content);
                                  setEditingPostId(post.id);
                                }}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${post.headline}\n\n${post.content}`);
                                  toast({ title: 'Copiado!' });
                                }}
                                title="Copiar"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={async () => {
                                  const updatedPosts = savedPosts.filter(p => p.id !== post.id);
                                  setSavedPosts(updatedPosts);
                                  
                                  if (user) {
                                    const { data: existing } = await supabase
                                      .from('collected_data')
                                      .select('id')
                                      .eq('user_id', user.id)
                                      .eq('data_type', 'linkedin_posts')
                                      .maybeSingle();
                                    
                                    if (existing) {
                                      await supabase
                                        .from('collected_data')
                                        .update({
                                          data_content: JSON.parse(JSON.stringify({ posts: updatedPosts })),
                                        })
                                        .eq('id', existing.id);
                                    }
                                  }
                                  
                                  toast({ title: 'Post excluído!' });
                                }}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Post Modal */}
      <AnimatePresence>
        {viewingPost && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingPost(null)}
          >
            <motion.div
              className="bg-card border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={CONTENT_TYPE_COLORS[viewingPost.type]}>
                    {CONTENT_TYPE_ICONS[viewingPost.type]} {CONTENT_TYPE_LABELS[viewingPost.type]}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setViewingPost(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                  <p className="font-bold text-lg mb-4">{viewingPost.headline}</p>
                  <p>{viewingPost.content}</p>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditPostHeadline(viewingPost.headline);
                      setEditPostContent(viewingPost.content);
                      setEditingPostId(viewingPost.id);
                      setViewingPost(null);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`${viewingPost.headline}\n\n${viewingPost.content}`);
                      toast({ title: 'Copiado!' });
                    }}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" /> Copiar tudo
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
