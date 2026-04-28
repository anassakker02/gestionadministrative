import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  nomComplet: string;
  cne: string;
}

interface AssignStudentToBourseModalProps {
  availableStudents: Student[];
  onAssign: (studentId: string) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  studentId: z.string().min(1, { message: "Veuillez sélectionner un étudiant." }),
});

const AssignStudentToBourseModal: React.FC<AssignStudentToBourseModalProps> = ({ 
  availableStudents, 
  onAssign, 
  onCancel 
}) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onAssign(values.studentId);
    toast({
      title: "Étudiant affecté",
      description: "L'étudiant a été affecté à la bourse avec succès.",
    });
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Étudiant</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? availableStudents.find(
                            (student) => student.id === field.value
                          )?.nomComplet
                        : "Sélectionner un étudiant"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un étudiant..." />
                    <CommandEmpty>Aucun étudiant trouvé.</CommandEmpty>
                    <CommandGroup>
                      {availableStudents.map((student) => (
                        <CommandItem
                          value={student.nomComplet}
                          key={student.id}
                          onSelect={() => {
                            form.setValue("studentId", student.id);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              student.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {student.nomComplet} ({student.cne})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            Affecter
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AssignStudentToBourseModal;
