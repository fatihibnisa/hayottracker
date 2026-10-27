import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { CreateTopicDto, CreateTopicSessionDto, UpdateTopicStatusDto } from './dto';

@ApiTags('topics')
@Controller('api/topics')
export class TopicsController {
  constructor(private topics: TopicsService) {}

  @Get()
  list(@Query('module') module?: 'data_science' | 'english', @Query('status') status?: 'todo' | 'done') {
    return this.topics.list(module, status);
  }

  @Post()
  create(@Body() dto: CreateTopicDto) {
    return this.topics.create(dto);
  }

  @Put(':id/status')
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTopicStatusDto) {
    return this.topics.setStatus(id, dto.status);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.topics.detail(id);
  }

  @Post(':id/sessions')
  addSession(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTopicSessionDto) {
    return this.topics.addSession(id, dto.date, dto.minutes, dto.note);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  removeSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.topics.removeSession(sessionId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.topics.remove(id);
  }
}
