'use client';

import { useEffect } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bubbles/ui/shadcn/form';
import { Input } from '@bubbles/ui/shadcn/input';
import { SubmitHandler, useForm } from 'react-hook-form';

import Spinner from '@/components/ui/loading/spinner';
import { IInputs } from '@/types/types';

type LoginFormProviderProps = Parameters<typeof Form>[0];

const LoginForm = () => {
  const form = useForm<IInputs>({
    defaultValues: { username: '', password: '' },
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isSubmitSuccessful },
  } = form;

  const onSubmit: SubmitHandler<IInputs> = async (data) => {
    try {
      console.log(
        'login-form starting logn fetch at ',
        new Date().toISOString()
      );
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const error = await res.json();
        console.error('Login fehlgeschlagen:', error.msg);
      }
    } catch (error) {
      console.error('Fehler beim Login:', error);
    }
  };
  useEffect(() => {
    reset({
      username: '',
      password: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitSuccessful]);

  return (
    <Form {...(form as unknown as LoginFormProviderProps)}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4 md:max-w-sm">
        <FormField
          control={control as never}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control as never}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Passwort</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Passwort" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-36 items-center justify-center place-self-start font-bold">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner />
              <span>Logging in...</span>
            </span>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
