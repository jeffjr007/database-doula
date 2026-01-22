import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface EditSectionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  type: "header" | "sumario" | "list" | "education" | "experience";
  data: any;
  onSave: (data: any) => void;
}

export function EditSectionModal({ open, onClose, title, type, data, onSave }: EditSectionModalProps) {
  const [formData, setFormData] = useState<any>(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderHeaderForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input value={formData.nome || ""} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
      </div>
      <div>
        <Label>Cargos</Label>
        <Input value={formData.cargos || ""} onChange={(e) => setFormData({ ...formData, cargos: e.target.value })} />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input value={formData.telefone || ""} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
      </div>
      <div>
        <Label>Localização</Label>
        <Input 
          value={formData.localizacao || ""} 
          onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} 
          placeholder="Ex: São Paulo, Brasil"
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      </div>
      <div>
        <Label>LinkedIn</Label>
        <Input value={formData.linkedin || ""} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nacionalidade</Label>
          <Input 
            value={formData.nacionalidade || ""} 
            onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })} 
            placeholder="Ex: BRASILEIRO"
          />
        </div>
        <div>
          <Label>Idade</Label>
          <Input 
            value={formData.idade || ""} 
            onChange={(e) => setFormData({ ...formData, idade: e.target.value })} 
            placeholder="Ex: 30"
          />
        </div>
      </div>
    </div>
  );

  const renderSumarioForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Parágrafos</Label>
        {formData.paragrafos?.map((p: string, i: number) => (
          <div key={i} className="flex gap-2 mt-2">
            <Textarea
              value={p}
              onChange={(e) => {
                const newParagrafos = [...formData.paragrafos];
                newParagrafos[i] = e.target.value;
                setFormData({ ...formData, paragrafos: newParagrafos });
              }}
              rows={3}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newParagrafos = formData.paragrafos.filter((_: any, idx: number) => idx !== i);
                setFormData({ ...formData, paragrafos: newParagrafos });
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setFormData({ ...formData, paragrafos: [...(formData.paragrafos || []), ""] })}
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar parágrafo
        </Button>
      </div>
      <div>
        <Label>Bullets Estratégicos</Label>
        {formData.bullets?.map((b: string, i: number) => (
          <div key={i} className="flex gap-2 mt-2">
            <Input
              value={b}
              onChange={(e) => {
                const newBullets = [...formData.bullets];
                newBullets[i] = e.target.value;
                setFormData({ ...formData, bullets: newBullets });
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newBullets = formData.bullets.filter((_: any, idx: number) => idx !== i);
                setFormData({ ...formData, bullets: newBullets });
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setFormData({ ...formData, bullets: [...(formData.bullets || []), ""] })}
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar bullet
        </Button>
      </div>
    </div>
  );

  const renderListForm = () => (
    <div className="space-y-2">
      {formData?.map((item: string, i: number) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const newList = [...formData];
              newList[i] = e.target.value;
              setFormData(newList);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFormData(formData.filter((_: any, idx: number) => idx !== i))}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setFormData([...formData, ""])}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar item
      </Button>
    </div>
  );

  const renderEducationForm = () => (
    <div className="space-y-4">
      {formData?.map((item: any, i: number) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Formação {i + 1}</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormData(formData.filter((_: any, idx: number) => idx !== i))}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          <div>
            <Label>Curso</Label>
            <Input
              value={item.curso || ""}
              onChange={(e) => {
                const newList = [...formData];
                newList[i] = { ...newList[i], curso: e.target.value };
                setFormData(newList);
              }}
            />
          </div>
          <div>
            <Label>Instituição</Label>
            <Input
              value={item.instituicao || ""}
              onChange={(e) => {
                const newList = [...formData];
                newList[i] = { ...newList[i], instituicao: e.target.value };
                setFormData(newList);
              }}
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setFormData([...formData, { curso: "", instituicao: "" }])}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar formação
      </Button>
    </div>
  );

  const renderExperienceForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {formData?.map((exp: any, i: number) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Experiência {i + 1}</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormData(formData.filter((_: any, idx: number) => idx !== i))}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empresa</Label>
              <Input
                value={exp.empresa || ""}
                onChange={(e) => {
                  const newList = [...formData];
                  newList[i] = { ...newList[i], empresa: e.target.value };
                  setFormData(newList);
                }}
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input
                value={exp.cargo || ""}
                onChange={(e) => {
                  const newList = [...formData];
                  newList[i] = { ...newList[i], cargo: e.target.value };
                  setFormData(newList);
                }}
              />
            </div>
          </div>
          <div>
            <Label>Período</Label>
            <Input
              value={exp.periodo || ""}
              onChange={(e) => {
                const newList = [...formData];
                newList[i] = { ...newList[i], periodo: e.target.value };
                setFormData(newList);
              }}
            />
          </div>
          <div>
            <Label>Bullets</Label>
            {exp.bullets?.map((b: string, j: number) => (
              <div key={j} className="flex gap-2 mt-2">
                <Textarea
                  value={b}
                  rows={2}
                  onChange={(e) => {
                    const newList = [...formData];
                    const newBullets = [...newList[i].bullets];
                    newBullets[j] = e.target.value;
                    newList[i] = { ...newList[i], bullets: newBullets };
                    setFormData(newList);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newList = [...formData];
                    newList[i] = {
                      ...newList[i],
                      bullets: newList[i].bullets.filter((_: any, idx: number) => idx !== j),
                    };
                    setFormData(newList);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                const newList = [...formData];
                newList[i] = { ...newList[i], bullets: [...(newList[i].bullets || []), ""] };
                setFormData(newList);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar bullet
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setFormData([...formData, { empresa: "", cargo: "", periodo: "", bullets: [] }])}
      >
        <Plus className="w-4 h-4 mr-1" /> Adicionar experiência
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {type === "header" && renderHeaderForm()}
          {type === "sumario" && renderSumarioForm()}
          {type === "list" && renderListForm()}
          {type === "education" && renderEducationForm()}
          {type === "experience" && renderExperienceForm()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
