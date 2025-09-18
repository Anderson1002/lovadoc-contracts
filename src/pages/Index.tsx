import { Layout } from "@/components/Layout";

const Index = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Sistema de Gestión Hospitalaria</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Bienvenido al sistema de gestión de contratos médicos
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
