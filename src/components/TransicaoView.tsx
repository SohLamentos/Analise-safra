import React from 'react';
import { TechnicianRecord, AppConfig } from '../types';
import RetentionTime from './RetentionTime';

interface TransicaoViewProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function TransicaoView({ data, config }: TransicaoViewProps) {
  return <RetentionTime data={data} config={config} />;
}
